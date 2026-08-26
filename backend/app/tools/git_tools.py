import os
import shutil
from pathlib import Path
from typing import Dict, Any, Optional
from ..sandbox.base import BaseSandbox


async def clone_repository(
    sandbox: BaseSandbox,
    repo_url: str,
    branch_name: str = "autofixer/attempt-1",
    reason: str = "Initial repository clone and working branch setup"
) -> Dict[str, Any]:
    """
    Clone a repository or copy a local repository directory into sandbox workspace,
    and create an isolated working branch.
    """
    # Check if repo_url is a local path or remote URL
    is_local = os.path.exists(repo_url) or repo_url.startswith("file://")
    
    if is_local:
        src_path = repo_url.replace("file://", "")
        # Copy directory contents to sandbox workspace
        for item in Path(src_path).iterdir():
            if item.name in [".git", "__pycache__", ".pytest_cache", "venv", ".venv"]:
                continue
            dest = Path(sandbox.workspace_path) / item.name
            if item.is_dir():
                shutil.copytree(item, dest, dirs_exist_ok=True)
            else:
                shutil.copy2(item, dest)
                
        # Initialize git repo in sandbox if needed
        await sandbox.execute_command("git init")
        await sandbox.execute_command("git config user.name 'AutoFixer AI'")
        await sandbox.execute_command("git config user.email 'agent@autofixer.ai'")
        await sandbox.execute_command("git add .")
        await sandbox.execute_command("git commit -m 'Initial commit before autofixer'")
        await sandbox.execute_command(f"git checkout -b {branch_name}")
    else:
        # Remote clone
        clone_cmd = f"git clone --depth 1 {repo_url} ."
        res = await sandbox.execute_command(clone_cmd)
        if not res.success:
            return {
                "success": False,
                "error": f"Failed to clone repository: {res.stderr or res.stdout}",
                "target": repo_url,
                "reason": reason
            }
        await sandbox.execute_command("git config user.name 'AutoFixer AI'")
        await sandbox.execute_command("git config user.email 'agent@autofixer.ai'")
        await sandbox.execute_command(f"git checkout -b {branch_name}")

    status_res = await sandbox.execute_command("git status --short")
    commit_res = await sandbox.execute_command("git rev-parse HEAD")
    files = await sandbox.list_files()

    return {
        "success": True,
        "repo_url": repo_url,
        "branch": branch_name,
        "commit_sha": commit_res.stdout.strip()[:8] if commit_res.success else "initial",
        "files_count": len(files),
        "target": repo_url,
        "reason": reason,
        "message": f"Successfully initialized repository on branch '{branch_name}' with {len(files)} files."
    }


async def git_diff(
    sandbox: BaseSandbox,
    target_file: Optional[str] = None,
    reason: str = "Inspect current patch changes"
) -> Dict[str, Any]:
    """Retrieve git diff of all modifications or a specific file."""
    cmd = f"git diff {target_file}" if target_file else "git diff"
    res = await sandbox.execute_command(cmd)
    
    diff_text = res.stdout.strip()
    return {
        "success": res.success,
        "diff": diff_text if diff_text else "(No uncommitted diff changes)",
        "has_changes": bool(diff_text),
        "target": target_file or "workspace",
        "reason": reason
    }


async def git_status(
    sandbox: BaseSandbox,
    reason: str = "Check workspace modification status"
) -> Dict[str, Any]:
    """Get current git status showing modified, staged, and untracked files."""
    res = await sandbox.execute_command("git status --short")
    lines = [line.strip() for line in res.stdout.splitlines() if line.strip()]
    
    modified = []
    untracked = []
    deleted = []
    
    for line in lines:
        status_code = line[:2]
        filepath = line[3:].strip()
        if "M" in status_code:
            modified.append(filepath)
        elif "??" in status_code:
            untracked.append(filepath)
        elif "D" in status_code:
            deleted.append(filepath)

    return {
        "success": res.success,
        "modified": modified,
        "untracked": untracked,
        "deleted": deleted,
        "raw_status": res.stdout,
        "target": "git_working_tree",
        "reason": reason
    }


async def rollback_changes(
    sandbox: BaseSandbox,
    target_file: Optional[str] = None,
    reason: str = "Rollback failing or invalid patch"
) -> Dict[str, Any]:
    """Revert uncommitted modifications in the working tree."""
    if target_file:
        res = await sandbox.execute_command(f"git checkout -- {target_file}")
    else:
        res1 = await sandbox.execute_command("git reset --hard HEAD")
        res2 = await sandbox.execute_command("git clean -fd")
        res = res1 if not res1.success else res2

    return {
        "success": res.success,
        "message": f"Successfully rolled back changes in {target_file or 'entire workspace'}.",
        "target": target_file or "workspace",
        "reason": reason
    }
