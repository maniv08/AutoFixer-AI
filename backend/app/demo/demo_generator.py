import os
import shutil
import tempfile
from pathlib import Path


def get_demo_repo_path() -> str:
    """Get the absolute path to the prepackaged demo repository."""
    # Find relative to project root
    current = Path(__file__).resolve().parent
    # Check parent paths
    for p in [current.parent.parent.parent / "demo_repo", Path("demo_repo").resolve()]:
        if p.exists() and (p / "string_engine").exists():
            return str(p)
    return str(Path("demo_repo").resolve())


def create_ephemeral_demo_copy() -> str:
    """Create an ephemeral copy of the demo repo in temp dir for a single isolated run."""
    demo_src = get_demo_repo_path()
    temp_dir = tempfile.mkdtemp(prefix="autofixer_demo_")
    shutil.copytree(demo_src, temp_dir, dirs_exist_ok=True)
    return temp_dir
