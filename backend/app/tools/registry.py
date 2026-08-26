from typing import Any, Callable, Dict, List, Optional
from ..sandbox.base import BaseSandbox
from .git_tools import clone_repository, git_diff, git_status, rollback_changes
from .file_tools import list_files, read_file, write_file, search_code, inspect_project
from .test_tools import detect_test_framework, install_dependencies, run_tests, run_specific_test
from .analysis_tools import run_linter, run_static_analysis
from .patch_tools import apply_patch
from .report_tools import create_report


# Tool declarations with JSON schema descriptions for LLM function calling
TOOL_DEFINITIONS = [
    {
        "name": "clone_repository",
        "description": "Clone a Git repository into the sandbox workspace and create an isolated working branch.",
        "parameters": {
            "type": "object",
            "properties": {
                "repo_url": {"type": "string", "description": "URL or local path of the repository to clone"},
                "branch_name": {"type": "string", "description": "Name of the working branch (e.g. autofixer/attempt-1)"},
                "reason": {"type": "string", "description": "Why this tool is being invoked"}
            },
            "required": ["repo_url", "reason"]
        }
    },
    {
        "name": "list_files",
        "description": "List files and directories in the sandbox workspace.",
        "parameters": {
            "type": "object",
            "properties": {
                "directory": {"type": "string", "description": "Relative directory path (empty string for root)"},
                "reason": {"type": "string", "description": "Why you are listing files"}
            },
            "required": ["reason"]
        }
    },
    {
        "name": "read_file",
        "description": "Read file contents with line numbers and optional line slicing.",
        "parameters": {
            "type": "object",
            "properties": {
                "file_path": {"type": "string", "description": "Relative path to file"},
                "start_line": {"type": "integer", "description": "Optional 1-indexed start line"},
                "end_line": {"type": "integer", "description": "Optional 1-indexed end line"},
                "reason": {"type": "string", "description": "Why you are reading this file"}
            },
            "required": ["file_path", "reason"]
        }
    },
    {
        "name": "write_file",
        "description": "Write or overwrite content directly to a file.",
        "parameters": {
            "type": "object",
            "properties": {
                "file_path": {"type": "string", "description": "Relative path to file"},
                "content": {"type": "string", "description": "Complete file content to write"},
                "reason": {"type": "string", "description": "Why you are writing this file"}
            },
            "required": ["file_path", "content", "reason"]
        }
    },
    {
        "name": "search_code",
        "description": "Search codebase for keywords, error messages, or regex patterns.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search string or regex"},
                "file_extension": {"type": "string", "description": "Optional extension filter e.g. .py"},
                "is_regex": {"type": "boolean", "description": "Whether query is a regex"},
                "reason": {"type": "string", "description": "Why you are searching for this pattern"}
            },
            "required": ["query", "reason"]
        }
    },
    {
        "name": "inspect_project",
        "description": "Inspect project structure, detected language, dependencies, and configuration manifests.",
        "parameters": {
            "type": "object",
            "properties": {
                "reason": {"type": "string", "description": "Reason for project inspection"}
            },
            "required": ["reason"]
        }
    },
    {
        "name": "detect_test_framework",
        "description": "Detect test framework (pytest, unittest, npm) and retrieve recommended test command.",
        "parameters": {
            "type": "object",
            "properties": {
                "reason": {"type": "string", "description": "Reason for test framework detection"}
            },
            "required": ["reason"]
        }
    },
    {
        "name": "install_dependencies",
        "description": "Install project dependencies in sandbox.",
        "parameters": {
            "type": "object",
            "properties": {
                "custom_command": {"type": "string", "description": "Optional custom install command"},
                "reason": {"type": "string", "description": "Reason for installing dependencies"}
            },
            "required": ["reason"]
        }
    },
    {
        "name": "run_tests",
        "description": "Execute the full test suite in the sandbox and get parsed test counts and stack traces.",
        "parameters": {
            "type": "object",
            "properties": {
                "test_command": {"type": "string", "description": "Optional custom test command"},
                "reason": {"type": "string", "description": "Reason for running tests"}
            },
            "required": ["reason"]
        }
    },
    {
        "name": "run_specific_test",
        "description": "Run a targeted single test file or test method.",
        "parameters": {
            "type": "object",
            "properties": {
                "test_target": {"type": "string", "description": "Target test path or expression"},
                "reason": {"type": "string", "description": "Reason for running this specific test"}
            },
            "required": ["test_target", "reason"]
        }
    },
    {
        "name": "run_linter",
        "description": "Run linter and AST syntax check on codebase or specific file.",
        "parameters": {
            "type": "object",
            "properties": {
                "target_file": {"type": "string", "description": "Optional file path to lint"},
                "reason": {"type": "string", "description": "Reason for running linter"}
            },
            "required": ["reason"]
        }
    },
    {
        "name": "run_static_analysis",
        "description": "Perform AST and static code health analysis to detect syntax or semantic issues.",
        "parameters": {
            "type": "object",
            "properties": {
                "target_file": {"type": "string", "description": "Optional file path to analyze"},
                "reason": {"type": "string", "description": "Reason for static analysis"}
            },
            "required": ["reason"]
        }
    },
    {
        "name": "apply_patch",
        "description": "Apply a surgical diff patch to fix a specific bug. Replaces original_snippet with replacement_snippet.",
        "parameters": {
            "type": "object",
            "properties": {
                "target_file": {"type": "string", "description": "Relative path to target file"},
                "original_snippet": {"type": "string", "description": "Exact code block to be replaced"},
                "replacement_snippet": {"type": "string", "description": "New replacement code block"},
                "explanation": {"type": "string", "description": "Short explanation of the fix"},
                "reason": {"type": "string", "description": "Reason for this patch"}
            },
            "required": ["target_file", "original_snippet", "replacement_snippet", "explanation", "reason"]
        }
    },
    {
        "name": "git_diff",
        "description": "Inspect uncommitted git diff in the sandbox.",
        "parameters": {
            "type": "object",
            "properties": {
                "target_file": {"type": "string", "description": "Optional file path to diff"},
                "reason": {"type": "string", "description": "Reason for checking diff"}
            },
            "required": ["reason"]
        }
    },
    {
        "name": "git_status",
        "description": "Check git working tree status (modified, untracked, deleted).",
        "parameters": {
            "type": "object",
            "properties": {
                "reason": {"type": "string", "description": "Reason for checking status"}
            },
            "required": ["reason"]
        }
    },
    {
        "name": "rollback_changes",
        "description": "Discard uncommitted changes or revert the sandbox to the checkpoint.",
        "parameters": {
            "type": "object",
            "properties": {
                "target_file": {"type": "string", "description": "Optional specific file to revert"},
                "reason": {"type": "string", "description": "Reason for rollback"}
            },
            "required": ["reason"]
        }
    },
    {
        "name": "create_report",
        "description": "Finalize and generate the post-mortem report upon success or escalation.",
        "parameters": {
            "type": "object",
            "properties": {
                "reason": {"type": "string", "description": "Reason for creating report"}
            },
            "required": ["reason"]
        }
    }
]


class ToolRegistry:
    """Registry for invoking agent tools in the sandbox."""

    def __init__(self, sandbox: BaseSandbox):
        self.sandbox = sandbox
        self._handlers: Dict[str, Callable] = {
            "clone_repository": self._wrap(clone_repository),
            "list_files": self._wrap(list_files),
            "read_file": self._wrap(read_file),
            "write_file": self._wrap(write_file),
            "search_code": self._wrap(search_code),
            "inspect_project": self._wrap(inspect_project),
            "detect_test_framework": self._wrap(detect_test_framework),
            "install_dependencies": self._wrap(install_dependencies),
            "run_tests": self._wrap(run_tests),
            "run_specific_test": self._wrap(run_specific_test),
            "run_linter": self._wrap(run_linter),
            "run_static_analysis": self._wrap(run_static_analysis),
            "apply_patch": self._wrap(apply_patch),
            "git_diff": self._wrap(git_diff),
            "git_status": self._wrap(git_status),
            "rollback_changes": self._wrap(rollback_changes),
        }

    def _wrap(self, func: Callable) -> Callable:
        async def wrapper(**kwargs) -> Dict[str, Any]:
            return await func(self.sandbox, **kwargs)
        return wrapper

    async def execute_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a registered tool by name with arguments."""
        if tool_name not in self._handlers:
            return {
                "success": False,
                "error": f"Tool '{tool_name}' not implemented.",
                "target": tool_name,
                "reason": arguments.get("reason", "unknown")
            }
        
        try:
            handler = self._handlers[tool_name]
            result = await handler(**arguments)
            return result
        except Exception as e:
            return {
                "success": False,
                "error": f"Tool execution failed: {str(e)}",
                "target": tool_name,
                "reason": arguments.get("reason", "unknown")
            }

    @staticmethod
    def get_tool_definitions() -> List[Dict[str, Any]]:
        """Return the JSON schema definitions for all tools."""
        return TOOL_DEFINITIONS
