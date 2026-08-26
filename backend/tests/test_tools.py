import pytest
from app.sandbox.process_sandbox import ProcessSandbox
from app.tools.registry import ToolRegistry


@pytest.mark.asyncio
async def test_tool_registry_execution():
    sandbox = ProcessSandbox()
    await sandbox.initialize()
    registry = ToolRegistry(sandbox)

    # 1. Write file
    write_res = await registry.execute_tool("write_file", {
        "file_path": "math_mod.py",
        "content": "def add(a, b):\n    return a + b\n",
        "reason": "Test write tool"
    })
    assert write_res["success"]

    # 2. Read file
    read_res = await registry.execute_tool("read_file", {
        "file_path": "math_mod.py",
        "reason": "Test read tool"
    })
    assert read_res["success"]
    assert "add(a, b)" in read_res["content"]

    # 3. Search code
    search_res = await registry.execute_tool("search_code", {
        "query": "def add",
        "reason": "Test search tool"
    })
    assert search_res["success"]
    assert search_res["matches_count"] >= 1

    # 4. Apply patch
    patch_res = await registry.execute_tool("apply_patch", {
        "target_file": "math_mod.py",
        "original_snippet": "return a + b",
        "replacement_snippet": "return (a + b) * 1",
        "explanation": "Test patch tool",
        "reason": "Test patching"
    })
    assert patch_res["success"]

    # 5. Run static analysis
    analysis_res = await registry.execute_tool("run_static_analysis", {
        "target_file": "math_mod.py",
        "reason": "Test analysis tool"
    })
    assert analysis_res["success"]

    await sandbox.cleanup()
