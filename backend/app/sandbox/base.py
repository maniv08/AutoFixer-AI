from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Tuple


class CommandResult:
    def __init__(
        self,
        command: str,
        exit_code: int,
        stdout: str,
        stderr: str,
        duration_seconds: float,
        timed_out: bool = False
    ):
        self.command = command
        self.exit_code = exit_code
        self.stdout = stdout
        self.stderr = stderr
        self.duration_seconds = duration_seconds
        self.timed_out = timed_out

    @property
    def success(self) -> bool:
        return self.exit_code == 0 and not self.timed_out

    def to_dict(self) -> Dict:
        return {
            "command": self.command,
            "exit_code": self.exit_code,
            "stdout": self.stdout,
            "stderr": self.stderr,
            "duration_seconds": self.duration_seconds,
            "timed_out": self.timed_out,
            "success": self.success
        }


class BaseSandbox(ABC):
    """Abstract sandbox environment for running repository operations."""

    @abstractmethod
    async def initialize(self) -> None:
        """Initialize the sandbox environment and temporary workspace."""
        pass

    @abstractmethod
    async def execute_command(
        self,
        command: str,
        cwd_relative: Optional[str] = None,
        timeout_seconds: Optional[int] = None,
        custom_env: Optional[Dict[str, str]] = None
    ) -> CommandResult:
        """Execute a command inside the sandbox."""
        pass

    @abstractmethod
    async def read_file(self, relative_path: str) -> str:
        """Read a file from the workspace."""
        pass

    @abstractmethod
    async def write_file(self, relative_path: str, content: str) -> None:
        """Write content to a file in the workspace."""
        pass

    @abstractmethod
    async def list_files(self, relative_path: str = "") -> List[str]:
        """List files recursively or in a directory."""
        pass

    @abstractmethod
    async def file_exists(self, relative_path: str) -> bool:
        """Check if a file exists."""
        pass

    @abstractmethod
    async def cleanup(self) -> None:
        """Clean up the sandbox workspace."""
        pass

    @property
    @abstractmethod
    def workspace_path(self) -> str:
        """Return the root path of the workspace."""
        pass
