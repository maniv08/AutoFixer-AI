import os
import re
from pathlib import Path
from typing import Dict, Any, List, Optional
from ..sandbox.base import BaseSandbox


async def list_files(
    sandbox: BaseSandbox,
    directory: str = "",
    reason: str = "Explore workspace files"
) -> Dict[str, Any]:
    """List all files in the project workspace."""
    try:
        files = await sandbox.list_files(directory)
        return {
            "success": True,
            "directory": directory or ".",
            "files": files,
            "count": len(files),
            "target": directory or ".",
            "reason": reason
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "target": directory,
            "reason": reason
        }


async def read_file(
    sandbox: BaseSandbox,
    file_path: str,
    start_line: Optional[int] = None,
    end_line: Optional[int] = None,
    reason: str = "Read source code for investigation"
) -> Dict[str, Any]:
    """
    Read content of a file with line numbering.
    Supports start_line and end_line slicing (1-indexed).
    """
    try:
        content = await sandbox.read_file(file_path)
        lines = content.splitlines()
        total_lines = len(lines)

        s_idx = max(0, (start_line - 1)) if start_line is not None else 0
        e_idx = min(total_lines, end_line) if end_line is not None else total_lines

        sliced_lines = lines[s_idx:e_idx]
        numbered = [f"{i + s_idx + 1:4d} | {line}" for i, line in enumerate(sliced_lines)]
        formatted_content = "\n".join(numbered)

        return {
            "success": True,
            "file_path": file_path,
            "total_lines": total_lines,
            "start_line": s_idx + 1,
            "end_line": e_idx,
            "content": formatted_content,
            "raw_content": "\n".join(sliced_lines),
            "target": file_path,
            "reason": reason
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to read {file_path}: {str(e)}",
            "target": file_path,
            "reason": reason
        }


async def write_file(
    sandbox: BaseSandbox,
    file_path: str,
    content: str,
    reason: str = "Write or update file content"
) -> Dict[str, Any]:
    """Write or overwrite content to a file."""
    try:
        await sandbox.write_file(file_path, content)
        return {
            "success": True,
            "file_path": file_path,
            "message": f"Successfully wrote {len(content.splitlines())} lines to {file_path}",
            "target": file_path,
            "reason": reason
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to write {file_path}: {str(e)}",
            "target": file_path,
            "reason": reason
        }


async def search_code(
    sandbox: BaseSandbox,
    query: str,
    file_extension: Optional[str] = None,
    is_regex: bool = False,
    reason: str = "Search codebase for identifiers or error strings"
) -> Dict[str, Any]:
    """Search for text or regex patterns across project files."""
    files = await sandbox.list_files()
    matches = []
    
    if file_extension:
        ext = file_extension if file_extension.startswith(".") else f".{file_extension}"
        files = [f for f in files if f.endswith(ext)]

    pattern = re.compile(query, re.IGNORECASE) if is_regex else None

    for f_path in files:
        try:
            content = await sandbox.read_file(f_path)
            lines = content.splitlines()
            for line_no, line in enumerate(lines, 1):
                matched = pattern.search(line) if is_regex else (query.lower() in line.lower())
                if matched:
                    matches.append({
                        "file": f_path,
                        "line_number": line_no,
                        "line_content": line.strip()
                    })
                    if len(matches) >= 50:  # Cap at 50 results
                        break
        except Exception:
            continue
        if len(matches) >= 50:
            break

    return {
        "success": True,
        "query": query,
        "matches_count": len(matches),
        "matches": matches,
        "target": query,
        "reason": reason
    }


async def inspect_project(
    sandbox: BaseSandbox,
    reason: str = "Inspect repository structure, language, and dependencies"
) -> Dict[str, Any]:
    """Inspect project architecture, files tree, dependencies and configuration."""
    files = await sandbox.list_files()
    
    # Detect language and package ecosystem
    language = "Unknown"
    manifests = []
    test_files = []
    
    if any(f.endswith(".py") for f in files):
        language = "Python"
    elif any(f.endswith((".js", ".ts", ".jsx", ".tsx")) for f in files):
        language = "JavaScript/TypeScript"

    for f in files:
        if f in ["pyproject.toml", "requirements.txt", "setup.py", "Pipfile", "package.json", "Cargo.toml", "go.mod"]:
            manifests.append(f)
        if "test" in f.lower() or f.endswith("_test.py") or f.startswith("test_"):
            test_files.append(f)

    # Read manifest snippet if available
    manifest_contents = {}
    for m in manifests[:3]:
        try:
            c = await sandbox.read_file(m)
            manifest_contents[m] = c[:500] + ("..." if len(c) > 500 else "")
        except Exception:
            pass

    return {
        "success": True,
        "language": language,
        "total_files": len(files),
        "manifests": manifests,
        "manifest_snippets": manifest_contents,
        "test_files": test_files,
        "file_tree": files[:30],
        "target": "repository_root",
        "reason": reason
    }
