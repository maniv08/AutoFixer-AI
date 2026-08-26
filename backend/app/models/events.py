from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field
from .agent_state import AgentState


class TestCounts(BaseModel):
    total: int = 0
    passed: int = 0
    failed: int = 0
    skipped: int = 0
    errors: int = 0
    duration_seconds: float = 0.0


class TestSummary(BaseModel):
    initial: Optional[TestCounts] = None
    current: Optional[TestCounts] = None
    target_all_passed: bool = False
    failed_test_names: List[str] = Field(default_factory=list)


class Hypothesis(BaseModel):
    symptom: str
    hypothesis: str
    root_cause: str
    confidence: float = 0.85
    affected_files: List[str] = Field(default_factory=list)
    proposed_fix: str = ""


class Reflection(BaseModel):
    observation: str
    hypothesis: str
    evidence: str
    previous_action: str
    why_it_failed: str
    new_plan: str
    expected_result: str
    user_summary: str


class PatchInfo(BaseModel):
    attempt: int
    target_file: str
    diff_content: str
    explanation: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class AgentEvent(BaseModel):
    event_id: str
    run_id: str
    event_type: str  # "state_change" | "tool_start" | "tool_end" | "terminal" | "test_update" | "patch" | "hypothesis" | "reflection" | "report" | "error"
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    data: Dict[str, Any] = Field(default_factory=dict)
    state: Optional[AgentState] = None
    attempt: int = 1
