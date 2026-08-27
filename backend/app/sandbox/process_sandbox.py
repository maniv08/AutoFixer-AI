import asyncio
import os
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from typing import Dict, List, Optional
from .base import BaseSandbox, CommandResult
from ..config import settings


# Sensitive environment variable keywords to purge from sandbox child processes
SENSITIVE_ENV_KEYS = {
    "KEY", "SECRET", "TOKEN", "PASSWORD", "CREDENTIAL", "AUTH",
    "GEMINI", "OPENAI", "ANTHROPIC", "AWS", "GITHUB", "API"
}

# Safe env vars to preserve
SAFE_ENV_ALLOWLIST = {
    "PATH", "PATHEXT", "SYSTEMROOT", "WINDIR", "TMP", "TEMP", "USERPROFILE",
    "HOME", "LANG", "LC_ALL", "PYTHONIOENCODING", "PYTHONUTF8", "NODE_ENV"
}


class ProcessSandbox(BaseSandbox):
    """
    Secure process-level isolated execution sandbox.
    Enforces working directory encapsulation, secret stripping, and hard wall-clock timeouts.
    """

    def __init__(self, workspace_root: Optional[str] = None, timeout_seconds: int = 60):
        self._custom_root = workspace_root
        self._temp_dir: Optional[str] = None
        self._workspace_path: Optional[Path] = None
        self.default_timeout = timeout_seconds or settings.SANDBOX_TIMEOUT_SECONDS

    @property
    def workspace_path(self) -> str:
        if not self._workspace_path:
            raise RuntimeError("Sandbox workspace not initialized. Call initialize() first.")
        return str(self._workspace_path.resolve())

    async def initialize(self) -> None:
        if self._custom_root:
            self._workspace_path = Path(self._custom_root).resolve()
            self._workspace_path.mkdir(parents=True, exist_ok=True)
        else:
            self._temp_dir = tempfile.mkdtemp(prefix="autofixer_sandbox_")
            self._workspace_path = Path(self._temp_dir).resolve()

    def _sanitize_env(self, custom_env: Optional[Dict[str, str]] = None) -> Dict[str, str]:
        """Strip sensitive host environment variables to prevent sandbox escape/leakage."""
        clean_env = {}
        for k, v in os.environ.items():
            k_upper = k.upper()
            if k_upper in SAFE_ENV_ALLOWLIST:
                clean_env[k] = v
            elif any(sens in k_upper for sens in SENSITIVE_ENV_KEYS):
                continue  # Skip secret variable
            else:
                # Retain safe general system vars
                clean_env[k] = v

        clean_env["PYTHONUNBUFFERED"] = "1"
        clean_env["PYTHONDONTWRITEBYTECODE"] = "1"
        clean_env["CI"] = "true"

        # Add workspace path and immediate subfolders to PYTHONPATH so modules in subdirectories can be imported by tests
        paths = []
        if self._workspace_path:
            p_ws = Path(self._workspace_path)
            if p_ws.exists():
                paths.append(str(p_ws))
                for sub in p_ws.iterdir():
                    if sub.is_dir() and not sub.name.startswith((".", "_", "venv", "node_modules", ".git")):
                        paths.append(str(sub))
        current_pythonpath = clean_env.get("PYTHONPATH", "")
        if current_pythonpath:
            paths.append(current_pythonpath)
        if paths:
            clean_env["PYTHONPATH"] = os.pathsep.join(paths)

        if custom_env:
            for k, v in custom_env.items():
                if not any(sens in k.upper() for sens in SENSITIVE_ENV_KEYS):
                    clean_env[k] = v

        return clean_env

    def _resolve_safe_path(self, relative_path: str) -> Path:
        """Resolve a relative path ensuring it stays strictly inside the workspace root."""
        root = Path(self.workspace_path).resolve()
        target = (root / relative_path).resolve()
        try:
            target.relative_to(root)
        except ValueError:
            raise ValueError(f"Path traversal attempted: '{relative_path}' is outside sandbox workspace.")

        # If the exact path does not exist, search subdirectories for matching file/path
        if not target.exists() and relative_path:
            norm_rel = relative_path.replace("\\", "/")
            for p in root.rglob("*"):
                parts = p.parts
                if not any(part in parts for part in [".git", "__pycache__", ".pytest_cache", ".venv", "venv", "node_modules"]):
                    p_rel = str(p.relative_to(root)).replace("\\", "/")
                    if p_rel.endswith(norm_rel):
                        return p

        return target

    async def execute_command(
        self,
        command: str,
        cwd_relative: Optional[str] = None,
        timeout_seconds: Optional[int] = None,
        custom_env: Optional[Dict[str, str]] = None
    ) -> CommandResult:
        timeout = timeout_seconds if timeout_seconds is not None else self.default_timeout
        work_dir = self._resolve_safe_path(cwd_relative) if cwd_relative else Path(self.workspace_path)
        clean_env = self._sanitize_env(custom_env)

        start_time = time.time()
        timed_out = False
        stdout_text = ""
        stderr_text = ""
        exit_code = -1

        # Format command for cross-platform execution
        use_shell = True
        
        try:
            proc = await asyncio.create_subprocess_shell(
                command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=str(work_dir),
                env=clean_env
            )

            try:
                stdout_bytes, stderr_bytes = await asyncio.wait_for(
                    proc.communicate(),
                    timeout=float(timeout)
                )
                stdout_text = stdout_bytes.decode("utf-8", errors="replace")
                stderr_text = stderr_bytes.decode("utf-8", errors="replace")
                exit_code = proc.returncode if proc.returncode is not None else -1
            except asyncio.TimeoutError:
                timed_out = True
                exit_code = -9
                stderr_text = f"[Sandbox Timeout]: Command exceeded hard execution limit of {timeout}s and was terminated."
                
                # Terminate process tree
                try:
                    if sys.platform == "win32":
                        subprocess.run(
                            f"taskkill /F /T /PID {proc.pid}",
                            shell=True,
                            stdout=subprocess.DEVNULL,
                            stderr=subprocess.DEVNULL
                        )
                    else:
                        proc.kill()
                except Exception:
                    pass

        except Exception as e:
            import traceback
            traceback.print_exc()
            exit_code = -1
            stderr_text = f"[Sandbox Execution Error]: {str(e)} ({type(e).__name__})"

        duration = time.time() - start_time
        return CommandResult(
            command=command,
            exit_code=exit_code,
            stdout=stdout_text,
            stderr=stderr_text,
            duration_seconds=round(duration, 3),
            timed_out=timed_out
        )

    async def read_file(self, relative_path: str) -> str:
        target = self._resolve_safe_path(relative_path)
        if not target.exists() or not target.is_file():
            raise FileNotFoundError(f"File not found: {relative_path}")
        return target.read_text(encoding="utf-8", errors="replace")

    async def write_file(self, relative_path: str, content: str) -> None:
        target = self._resolve_safe_path(relative_path)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")

    async def list_files(self, relative_path: str = "") -> List[str]:
        target_dir = self._resolve_safe_path(relative_path)
        if not target_dir.exists():
            return []
        
        results = []
        root = Path(self.workspace_path)
        for path in target_dir.rglob("*"):
            # Exclude virtualenvs, git internals, node_modules, and cache dirs
            parts = path.parts
            if any(p in parts for p in [".git", "__pycache__", ".pytest_cache", ".venv", "venv", "node_modules"]):
                continue
            if path.is_file():
                rel = path.relative_to(root)
                results.append(str(rel).replace("\\", "/"))
        return sorted(results)

    async def file_exists(self, relative_path: str) -> bool:
        try:
            target = self._resolve_safe_path(relative_path)
            return target.exists()
        except ValueError:
            return False

    async def cleanup(self) -> None:
        if self._temp_dir and Path(self._temp_dir).exists():
            try:
                # Handle Windows file locks on cleanup
                shutil.rmtree(self._temp_dir, ignore_errors=True)
            except Exception:
                pass
            self._temp_dir = None
            self._workspace_path = None
