from typing import Optional
from .base import BaseSandbox, CommandResult
from .process_sandbox import ProcessSandbox
from .docker_sandbox import DockerSandbox
from ..config import settings


def create_sandbox(
    sandbox_type: Optional[str] = None,
    workspace_root: Optional[str] = None,
    timeout_seconds: Optional[int] = None
) -> BaseSandbox:
    """Factory creating the appropriate sandbox instance."""
    stype = sandbox_type or settings.SANDBOX_TYPE
    timeout = timeout_seconds or settings.SANDBOX_TIMEOUT_SECONDS

    if stype == "docker":
        return DockerSandbox(
            workspace_root=workspace_root,
            timeout_seconds=timeout
        )
    else:
        return ProcessSandbox(
            workspace_root=workspace_root,
            timeout_seconds=timeout
        )
