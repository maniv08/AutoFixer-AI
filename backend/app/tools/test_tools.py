import re
import sys
from typing import Dict, Any, List, Optional
from ..sandbox.base import BaseSandbox
from ..models.events import TestCounts


def parse_pytest_output(output: str) -> Dict[str, Any]:
    """Parse pytest stdout to extract pass/fail/error counts and failed test details."""
    passed = 0
    failed = 0
    skipped = 0
    errors = 0
    
    # Example summary lines:
    # "=== 2 failed, 4 passed in 0.12s ==="
    # "=== 6 passed in 0.05s ==="
    # "=== 1 error in 0.01s ==="
    pass_match = re.search(r"(\d+)\s+passed", output)
    if pass_match:
        passed = int(pass_match.group(1))

    fail_match = re.search(r"(\d+)\s+failed", output)
    if fail_match:
        failed = int(fail_match.group(1))

    skip_match = re.search(r"(\d+)\s+skipped", output)
    if skip_match:
        skipped = int(skip_match.group(1))

    err_match = re.search(r"(\d+)\s+error", output)
    if err_match:
        errors = int(err_match.group(1))

    # Extract failed test names
    failed_tests = []
    fail_lines = re.findall(r"FAILED\s+([^\s]+)", output)
    for fl in fail_lines:
        failed_tests.append(fl.strip())

    total = passed + failed + skipped + errors
    
    # Extract failure stack traces / error summaries
    failure_blocks = []
    if "FAILURES" in output:
        parts = output.split("FAILURES")
        if len(parts) > 1:
            failure_blocks.append(parts[1][:2500])  # Capture relevant slice

    return {
        "passed": passed,
        "failed": failed,
        "skipped": skipped,
        "errors": errors,
        "total": total if total > 0 else (1 if failed or errors else 0),
        "failed_test_names": failed_tests,
        "failure_details": "\n".join(failure_blocks).strip()
    }


def parse_unittest_output(output: str) -> Dict[str, Any]:
    """Parse standard python unittest output."""
    passed = 0
    failed = 0
    errors = 0
    
    # "Ran 5 tests in 0.002s"
    # "FAILED (failures=2, errors=1)" or "OK"
    total_match = re.search(r"Ran\s+(\d+)\s+tests?", output)
    total = int(total_match.group(1)) if total_match else 0

    if "OK" in output and "FAILED" not in output:
        passed = total
    else:
        fail_m = re.search(r"failures=(\d+)", output)
        err_m = re.search(r"errors=(\d+)", output)
        if fail_m:
            failed = int(fail_m.group(1))
        if err_m:
            errors = int(err_m.group(1))
        passed = max(0, total - failed - errors)

    return {
        "passed": passed,
        "failed": failed,
        "skipped": 0,
        "errors": errors,
        "total": total,
        "failed_test_names": [],
        "failure_details": output[-1500:] if failed or errors else ""
    }


async def detect_test_framework(
    sandbox: BaseSandbox,
    reason: str = "Detect repository test framework and runner"
) -> Dict[str, Any]:
    """
    Detect whether pytest, unittest, npm test, or mvn test is configured.
    Returns success: False if no valid test framework/files can be detected.
    """
    files = await sandbox.list_files()
    
    # 1. Check for Node.js (package.json)
    if any(f == "package.json" or f.endswith("/package.json") for f in files):
        return {
            "success": True,
            "test_framework": "npm / jest",
            "suggested_command": "npm test",
            "language": "JavaScript/TypeScript",
            "target": "package.json",
            "reason": reason
        }

    # 2. Check for Java Maven (pom.xml)
    if any(f == "pom.xml" or f.endswith("/pom.xml") for f in files):
        return {
            "success": True,
            "test_framework": "Maven (JUnit/TestNG)",
            "suggested_command": "mvn test",
            "language": "Java",
            "target": "pom.xml",
            "reason": reason
        }

    # 3. Check for Python test configs or test files
    has_pytest_config = any(f in ["pytest.ini", "setup.cfg", "pyproject.toml", "tox.ini", "conftest.py"] or f.endswith("/pytest.ini") or f.endswith("/conftest.py") for f in files)
    has_test_files = any(
        "test_" in f.lower() or "_test.py" in f.lower() or "tests/" in f.lower() or "test/" in f.lower()
        for f in files
    )
    has_python_files = any(f.endswith(".py") for f in files)

    if has_pytest_config or has_test_files:
        return {
            "success": True,
            "test_framework": "pytest",
            "suggested_command": "pytest",
            "language": "Python",
            "target": "pytest_configuration",
            "reason": reason
        }
    elif has_python_files:
        # Fallback to python unittest discover
        return {
            "success": True,
            "test_framework": "unittest",
            "suggested_command": f"{sys.executable} -m unittest discover",
            "language": "Python",
            "target": "unittest_discovery",
            "reason": reason
        }

    # No test framework detected
    return {
        "success": False,
        "error": "Test framework could not be detected. Please provide a Test Command manually.",
        "target": "unknown",
        "reason": reason
    }


async def install_dependencies(
    sandbox: BaseSandbox,
    custom_command: Optional[str] = None,
    reason: str = "Install project dependencies in sandbox"
) -> Dict[str, Any]:
    """Install project dependencies."""
    files = await sandbox.list_files()
    
    if custom_command:
        cmd = custom_command
    elif "requirements.txt" in files:
        cmd = f"{sys.executable} -m pip install -r requirements.txt"
    elif "pyproject.toml" in files or "setup.py" in files:
        cmd = f"{sys.executable} -m pip install -e ."
    elif "package.json" in files:
        cmd = "npm install"
    else:
        cmd = f"{sys.executable} -m pip install pytest"

    res = await sandbox.execute_command(cmd, timeout_seconds=180)
    
    return {
        "success": res.success,
        "command": cmd,
        "stdout": res.stdout[-1000:] if res.stdout else "",
        "stderr": res.stderr[-1000:] if res.stderr else "",
        "duration_seconds": res.duration_seconds,
        "target": "dependencies",
        "reason": reason
    }


async def run_tests(
    sandbox: BaseSandbox,
    test_command: Optional[str] = None,
    reason: str = "Execute repository test suite"
) -> Dict[str, Any]:
    """
    Run full test suite in sandbox.
    Captures exit code, stdout/stderr, pass/fail/skip counts, stack traces, duration.
    """
    if not test_command:
        detect_res = await detect_test_framework(sandbox)
        test_command = detect_res["suggested_command"]

    cmd_to_run = test_command
    if cmd_to_run.startswith("pytest"):
        cmd_to_run = cmd_to_run.replace("pytest", f'"{sys.executable}" -m pytest', 1)

    res = await sandbox.execute_command(cmd_to_run, timeout_seconds=60)
    
    # Parse results
    combined_output = f"{res.stdout}\n{res.stderr}"
    if "pytest" in test_command:
        parsed = parse_pytest_output(combined_output)
    else:
        parsed = parse_unittest_output(combined_output)

    counts = TestCounts(
        total=parsed["total"],
        passed=parsed["passed"],
        failed=parsed["failed"],
        skipped=parsed["skipped"],
        errors=parsed["errors"],
        duration_seconds=res.duration_seconds
    )

    all_passed = (res.exit_code == 0 and parsed["failed"] == 0 and parsed["errors"] == 0)

    return {
        "success": res.success or all_passed,
        "all_tests_passed": all_passed,
        "command": test_command,
        "exit_code": res.exit_code,
        "stdout": res.stdout,
        "stderr": res.stderr,
        "counts": counts.model_dump(),
        "failed_test_names": parsed["failed_test_names"],
        "failure_details": parsed.get("failure_details", ""),
        "duration_seconds": res.duration_seconds,
        "timed_out": res.timed_out,
        "target": test_command,
        "reason": reason
    }


async def run_specific_test(
    sandbox: BaseSandbox,
    test_target: str,
    reason: str = "Run targeted single test case"
) -> Dict[str, Any]:
    """Run a specific test file or method."""
    cmd = f"{sys.executable} -m pytest -v {test_target}"
    res = await sandbox.execute_command(cmd, timeout_seconds=45)
    combined = f"{res.stdout}\n{res.stderr}"
    parsed = parse_pytest_output(combined)

    return {
        "success": res.success,
        "test_target": test_target,
        "command": cmd,
        "exit_code": res.exit_code,
        "stdout": res.stdout,
        "stderr": res.stderr,
        "counts": parsed,
        "duration_seconds": res.duration_seconds,
        "target": test_target,
        "reason": reason
    }
