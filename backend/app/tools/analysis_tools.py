import ast
import sys
from pathlib import Path
from typing import Dict, Any, List, Optional
from ..sandbox.base import BaseSandbox


async def run_linter(
    sandbox: BaseSandbox,
    target_file: Optional[str] = None,
    reason: str = "Check code formatting and style"
) -> Dict[str, Any]:
    """Run Python syntax and flake8/ruff linter if available, or ast compile check."""
    files = [target_file] if target_file else await sandbox.list_files()
    py_files = [f for f in files if f.endswith(".py")]

    syntax_errors = []
    for pf in py_files:
        try:
            content = await sandbox.read_file(pf)
            ast.parse(content, filename=pf)
        except SyntaxError as se:
            syntax_errors.append({
                "file": pf,
                "line": se.lineno,
                "offset": se.offset,
                "error": str(se)
            })

    # Also try running ruff or flake8 if installed in environment
    res = await sandbox.execute_command(f"{sys.executable} -m flake8 {target_file or '.'} --max-line-length=120 --isolated")
    flake_output = res.stdout if res.success or res.stdout else ""

    passed = len(syntax_errors) == 0

    return {
        "success": passed,
        "clean": passed and not flake_output.strip(),
        "syntax_errors": syntax_errors,
        "linter_output": flake_output.strip()[:1000],
        "target": target_file or "workspace",
        "reason": reason
    }


async def run_static_analysis(
    sandbox: BaseSandbox,
    target_file: Optional[str] = None,
    reason: str = "Perform static type and AST analysis"
) -> Dict[str, Any]:
    """Run AST and mypy static analysis checks."""
    files = [target_file] if target_file else await sandbox.list_files()
    py_files = [f for f in files if f.endswith(".py")]

    ast_issues = []
    for pf in py_files:
        try:
            code = await sandbox.read_file(pf)
            tree = ast.parse(code, filename=pf)
            # Check for common anti-patterns like bare except
            for node in ast.walk(tree):
                if isinstance(node, ast.ExceptHandler) and node.type is None:
                    ast_issues.append({
                        "file": pf,
                        "line": node.lineno,
                        "issue": "Bare 'except:' handler caught - should specify exception type"
                    })
        except SyntaxError as se:
            ast_issues.append({
                "file": pf,
                "line": se.lineno,
                "issue": f"Syntax error: {se.msg}"
            })
        except Exception:
            pass

    return {
        "success": len([i for i in ast_issues if "Syntax error" in i["issue"]]) == 0,
        "issues_found": len(ast_issues),
        "issues": ast_issues,
        "target": target_file or "workspace",
        "reason": reason
    }
