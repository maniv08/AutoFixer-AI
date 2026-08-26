import asyncio
import os
import shutil
import subprocess
import tempfile
import time
from pathlib import Path
from typing import Dict, List, Optional
from .base import BaseSandbox, CommandResult
from .process_sandbox import ProcessSandbox
from ..config import settings


class DockerSandbox(BaseSandbox):
    """
    Docker container sandbox with memory limits, CPU quotas, and filesystem confinement.
    Falls back to ProcessSandbox if Docker daemon is not active.
    """

    def __init__(
        self,
        image_name: str = "python:3.11-slim",
        workspace_root: Optional[str] = None,
        timeout_seconds: int = 60,
        memory_limit: str = "512m",
        cpu_limit: str = "1.0"
    ):
        self.image_name = image_name
        self._custom_root = workspace_root
        self._temp_dir: Optional[str] = None
        self._workspace_path: Optional[Path] = None
        self.timeout_seconds = timeout_seconds or settings.SANDBOX_TIMEOUT_SECONDS
        self.memory_limit = memory_limit
        self.cpu_limit = cpu_limit
        self._docker_available = False
        self._fallback_sandbox: Optional[ProcessSandbox] = None

    @property
    def workspace_path(self) -> str:
        if self._fallback_sandbox:
            return self._fallback_sandbox.workspace_path
        if not self._workspace_path:
            raise RuntimeError("Sandbox workspace not initialized. Call initialize() first.")
        return str(self._workspace_path.resolve())

    async def initialize(self) -> None:
        # Check if Docker is running
        try:
            res = subprocess.run(
                ["docker", "info"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                timeout=5
            )
            self._docker_available = (res.returncode == 0)
        except Exception:
            self._docker_available = False

        if not self._docker_available:
            # Fallback to secure process sandbox
            self._fallback_sandbox = ProcessSandbox(
                workspace_root=self._custom_root,
                timeout_seconds=self.timeout_seconds
            )
            await self._fallback_sandbox.initialize()
            return

        if self._custom_root:
            self._workspace_path = Path(self._custom_root).resolve()
            self._workspace_path.mkdir(parents=True, exist_ok=True)
        else:
            self._temp_dir = tempfile.mkdtemp(prefix="autofixer_docker_")
            self._workspace_path = Path(self._temp_dir).resolve()

    async def execute_command(
        self,
        command: str,
        cwd_relative: Optional[str] = None,
        timeout_seconds: Optional[int] = None,
        custom_env: Optional[Dict[str, str]] = None
    ) -> CommandResult:
        if self._fallback_sandbox:
            return await self._fallback_sandbox.execute_command(
                command, cwd_relative, timeout_seconds, custom_env
            )

        timeout = timeout_seconds if timeout_seconds is not None else self.timeout_seconds
        work_dir = f"/workspace/{cwd_relative}" if cwd_relative else "/workspace"

        # Build docker run command
        docker_cmd = [
            "docker", "run", "--rm",
            "-v", f"{self.workspace_path}:/workspace",
            "-w", work_dir,
            f"--memory={self.memory_limit}",
            f"--cpus={self.cpu_limit}",
            "--network", "none"  # Restrict sandbox network access
        ]

        if custom_env:
            for k, v in custom_env.items():
                docker_cmd.extend(["-e", f"{k}={v}"])

        docker_cmd.extend([self.image_name, "sh", "-c", command])

        start_time = time.time()
        timed_out = False
        stdout_text = ""
        stderr_text = ""
        exit_code = -1

        try:
            proc = await asyncio.create_subprocess_exec(
                *docker_cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
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
                stderr_text = f"[Docker Sandbox Timeout]: Command exceeded execution limit of {timeout}s."
                try:
                    proc.kill()
                except Exception:
                    pass

        except Exception as e:
            exit_code = -1
            stderr_text = f"[Docker Sandbox Error]: {str(e)}"

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
        if self._fallback_sandbox:
            return await self._fallback_sandbox.read_file(relative_path)
        target = (Path(self.workspace_path) / relative_path).resolve()
        if not target.exists() or not target.is_file():
            raise FileNotFoundError(f"File not found: {relative_path}")
        return target.read_text(encoding="utf-8", errors="replace")

    async def write_file(self, relative_path: str, content: str) -> None:
        if self._fallback_sandbox:
            return await self._fallback_sandbox.write_file(relative_path, content)
        target = (Path(self.workspace_path) / relative_path).resolve()
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")

    async def list_files(self, relative_path: str = "") -> List[str]:
        if self._fallback_sandbox:
            return await self._fallback_sandbox.list_files(relative_path)
        target_dir = (Path(self.workspace_path) / relative_path).resolve()
        if not target_dir.exists():
            return []
        results = []
        root = Path(self.workspace_path)
        for path in target_dir.rglob("*"):
            parts = path.parts
            if any(p in parts for p in [".git", "__pycache__", ".pytest_cache", ".venv", "venv"]):
                continue
            if path.is_file():
                rel = path.relative_to(root)
                results.append(str(rel).replace("\\", "/"))
        return sorted(results)

    async def file_exists(self, relative_path: str) -> bool:
        if self._fallback_sandbox:
            return await self._fallback_sandbox.file_exists(relative_path)
        target = (Path(self.workspace_path) / relative_path).resolve()
        return target.exists()

    async def cleanup(self) -> None:
        if self._fallback_sandbox:
            await self._fallback_sandbox.cleanup()
            return
        if self._temp_dir and Path(self._temp_dir).exists():
            try:
                shutil.rmtree(self._temp_dir, ignore_errors=True)
            except Exception:
                pass
            self._temp_dir = None
            self._workspace_path = None
