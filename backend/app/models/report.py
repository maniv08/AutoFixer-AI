from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field
from .events import TestCounts, PatchInfo, Hypothesis, Reflection
from .agent_state import AgentState


class HumanEscalationDetails(BaseModel):
    what_was_tried: List[str] = Field(default_factory=list)
    current_hypothesis: str = ""
    files_touched: List[str] = Field(default_factory=list)
    remaining_failures: List[str] = Field(default_factory=list)
    recommended_next_step: str = ""


class FinalReport(BaseModel):
    run_id: str
    repo_url: str
    repo_name: str = ""
    branch: str = "autofixer/attempt-main"
    language: str = "Python"
    framework: str = "Standard"
    test_framework: str = "pytest"
    initial_test_results: Optional[TestCounts] = None
    final_test_results: Optional[TestCounts] = None
    root_causes: List[Hypothesis] = Field(default_factory=list)
    reflections: List[Reflection] = Field(default_factory=list)
    files_modified: List[str] = Field(default_factory=list)
    patches: List[PatchInfo] = Field(default_factory=list)
    attempts_count: int = 1
    max_attempts: int = 5
    execution_time_seconds: float = 0.0
    status: AgentState = AgentState.SUCCESS
    human_escalation: Optional[HumanEscalationDetails] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    markdown_report: str = ""
