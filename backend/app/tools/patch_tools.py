import ast
import difflib
from typing import Dict, Any, Optional
from ..sandbox.base import BaseSandbox
from .git_tools import git_diff


async def apply_patch(
    sandbox: BaseSandbox,
    target_file: str,
    original_snippet: str,
    replacement_snippet: str,
    explanation: str = "Apply minimal bug fix patch",
    reason: str = "Apply surgical patch to resolve root cause"
) -> Dict[str, Any]:
    """
    Apply a surgical diff patch to a target file by replacing a specific snippet.
    Validates Python syntax before finalizing.
    """
    try:
        resolved_file = target_file
        if not await sandbox.file_exists(resolved_file):
            all_files = await sandbox.list_files()
            norm_target = target_file.replace("\\", "/")
            matching = [f for f in all_files if f.replace("\\", "/").endswith(norm_target)]
            if matching:
                resolved_file = matching[0]
            else:
                return {
                    "success": False,
                    "error": f"Target file '{target_file}' does not exist.",
                    "target": target_file,
                    "reason": reason
                }
        target_file = resolved_file

        original_content = await sandbox.read_file(target_file)
        
        # Normalize newlines
        clean_orig_content = original_content.replace("\r\n", "\n")
        clean_orig_snippet = original_snippet.replace("\r\n", "\n").strip()
        clean_repl_snippet = replacement_snippet.replace("\r\n", "\n").strip()

        if clean_orig_snippet not in clean_orig_content:
            # Try fuzzy/whitespace-stripped search if exact fails
            orig_lines = [l.strip() for l in clean_orig_snippet.splitlines()]
            file_lines = clean_orig_content.splitlines()
            
            # Check if snippet exists with whitespace variations
            matched = False
            for i in range(len(file_lines) - len(orig_lines) + 1):
                slice_lines = [l.strip() for l in file_lines[i:i + len(orig_lines)]]
                if slice_lines == orig_lines:
                    # Found location
                    start_pos = sum(len(l) + 1 for l in file_lines[:i])
                    end_pos = sum(len(l) + 1 for l in file_lines[:i + len(orig_lines)])
                    new_content = clean_orig_content[:start_pos] + clean_repl_snippet + "\n" + clean_orig_content[end_pos:]
                    matched = True
                    break
            
            if not matched:
                return {
                    "success": False,
                    "error": "Target original_snippet could not be uniquely found in the file. Please provide exact matching lines.",
                    "target": target_file,
                    "reason": reason
                }
        else:
            new_content = clean_orig_content.replace(clean_orig_snippet, clean_repl_snippet, 1)

        # Pre-validate Python syntax if Python file
        if target_file.endswith(".py"):
            try:
                ast.parse(new_content, filename=target_file)
            except SyntaxError as se:
                return {
                    "success": False,
                    "error": f"Patch introduced a syntax error: {se.msg} at line {se.lineno}",
                    "syntax_invalid": True,
                    "target": target_file,
                    "reason": reason
                }

        # Write patched file
        await sandbox.write_file(target_file, new_content)

        # Extract git diff
        diff_res = await git_diff(sandbox, target_file=target_file)

        return {
            "success": True,
            "target_file": target_file,
            "explanation": explanation,
            "diff": diff_res.get("diff", ""),
            "message": f"Successfully patched {target_file}",
            "target": target_file,
            "reason": reason
        }

    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to apply patch: {str(e)}",
            "target": target_file,
            "reason": reason
        }
