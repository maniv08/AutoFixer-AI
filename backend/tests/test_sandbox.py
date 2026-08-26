import pytest
import os
from app.sandbox.process_sandbox import ProcessSandbox


@pytest.mark.asyncio
async def test_process_sandbox_lifecycle():
    sandbox = ProcessSandbox()
    await sandbox.initialize()
    
    assert os.path.exists(sandbox.workspace_path)
    
    # Test writing and reading files
    await sandbox.write_file("test.txt", "hello world")
    assert await sandbox.file_exists("test.txt")
    
    content = await sandbox.read_file("test.txt")
    assert content == "hello world"
    
    # Test command execution
    res = await sandbox.execute_command("python -c \"print('sandbox_ok')\"")
    assert res.success
    assert "sandbox_ok" in res.stdout
    
    # Test secret stripping
    # Set a dummy secret in host env
    os.environ["SECRET_API_KEY_DUMMY"] = "supersecret"
    res_env = await sandbox.execute_command("python -c \"import os; print(os.environ.get('SECRET_API_KEY_DUMMY', 'STRIPPED'))\"")
    assert "STRIPPED" in res_env.stdout
    
    await sandbox.cleanup()
