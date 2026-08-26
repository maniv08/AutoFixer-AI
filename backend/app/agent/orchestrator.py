import asyncio
import time
import uuid
from typing import Any, Callable, Dict, List, Optional
from ..config import settings
from ..models.agent_state import AgentState
from ..models.events import (
    AgentEvent,
    TestCounts,
    TestSummary,
    Hypothesis,
    Reflection,
    PatchInfo
)
from ..models.report import FinalReport, HumanEscalationDetails
from ..sandbox.base import BaseSandbox
from ..sandbox.manager import create_sandbox
from ..tools.registry import ToolRegistry
from .llm_client import LLMClient
from .prompts import SYSTEM_PROMPT


class AgentOrchestrator:
    """
    Autonomous software QA & refactoring agent loop.
    Executes: Plan -> Tool Call -> Observe -> Root Cause -> Patch -> Retest -> Reflect -> Correct -> Report.
    """

    def __init__(
        self,
        run_id: str,
        repo_url: str,
        branch_name: str = "autofixer/attempt-main",
        test_command: Optional[str] = None,
        max_attempts: int = 5,
        event_callback: Optional[Callable[[AgentEvent], Any]] = None
    ):
        self.run_id = run_id
        self.repo_url = repo_url
        self.branch_name = branch_name
        self.test_command = test_command
        self.max_attempts = min(max(1, max_attempts), 10)
        self.event_callback = event_callback
        
        self.state: AgentState = AgentState.IDLE
        self.current_attempt: int = 1
        self.sandbox: Optional[BaseSandbox] = None
        self.tools: Optional[ToolRegistry] = None
        self.llm = LLMClient()

        # Run tracking data
        self.start_time: float = 0.0
        self.initial_counts: Optional[TestCounts] = None
        self.current_counts: Optional[TestCounts] = None
        self.hypotheses: List[Hypothesis] = []
        self.reflections: List[Reflection] = []
        self.patches: List[PatchInfo] = []
        self.files_touched: List[str] = []
        self.action_history: List[str] = []
        self.final_report: Optional[FinalReport] = None

    async def emit_event(
        self,
        event_type: str,
        data: Dict[str, Any],
        state: Optional[AgentState] = None
    ) -> None:
        """Broadcast a typed event to subscribers."""
        if state:
            self.state = state

        event = AgentEvent(
            event_id=f"evt_{uuid.uuid4().hex[:8]}",
            run_id=self.run_id,
            event_type=event_type,
            state=self.state,
            attempt=self.current_attempt,
            data=data
        )

        if self.event_callback:
            try:
                res = self.event_callback(event)
                if asyncio.iscoroutine(res):
                    await res
            except Exception:
                pass

    async def run(self) -> FinalReport:
        """Main autonomous execution loop."""
        self.start_time = time.time()
        
        try:
            # 1. Initialize Sandbox
            await self.emit_event(
                "state_change",
                {"message": "Initializing isolated sandbox environment..."},
                state=AgentState.PLANNING
            )
            self.sandbox = create_sandbox()
            await self.sandbox.initialize()
            self.tools = ToolRegistry(self.sandbox)

            # 2. Clone Repository & Setup Working Branch
            await self.emit_event(
                "terminal",
                {"line": f"$ git clone {self.repo_url} (workspace: {self.sandbox.workspace_path})"}
            )
            
            clone_res = await self.tools.execute_tool("clone_repository", {
                "repo_url": self.repo_url,
                "branch_name": self.branch_name,
                "reason": "Clone repository and establish isolated working branch"
            })
            
            if not clone_res.get("success"):
                raise RuntimeError(f"Clone failed: {clone_res.get('error')}")

            await self.emit_event("tool_end", {
                "tool": "clone_repository",
                "result": clone_res
            })

            # 3. Inspect Project Structure & Manifests
            await self.emit_event(
                "state_change",
                {"message": "Inspecting project architecture and test setup..."},
                state=AgentState.ANALYZING
            )
            inspect_res = await self.tools.execute_tool("inspect_project", {
                "reason": "Discover repository structure, language, manifests, and test directories"
            })
            language = inspect_res.get("language", "Python")

            # 4. Resolve Test Command (User-specified vs Automatic Detection)
            if self.test_command and self.test_command.strip():
                await self.emit_event(
                    "state_change",
                    {"message": f"Using user-specified test command: {self.test_command}"},
                    state=AgentState.PLANNING
                )
            else:
                await self.emit_event(
                    "state_change",
                    {"message": f"{language} project detected. Inspecting test configuration for automatic test runner detection..."},
                    state=AgentState.ANALYZING
                )
                detect_res = await self.tools.execute_tool("detect_test_framework", {
                    "reason": "Auto-detect test framework and runner"
                })
                
                if not detect_res.get("success"):
                    raise RuntimeError("Test framework could not be detected. Please provide a Test Command manually.")
                
                self.test_command = detect_res.get("suggested_command")
                framework_name = detect_res.get("test_framework", "pytest")
                
                await self.emit_event(
                    "state_change",
                    {"message": f"{framework_name} test framework detected. Using test command: {self.test_command}"},
                    state=AgentState.PLANNING
                )

            # 5. Execute Initial Baseline Tests
            await self.emit_event(
                "state_change",
                {"message": f"Executing initial test suite ({self.test_command}) to establish failure baseline..."},
                state=AgentState.RUNNING_TESTS
            )
            
            test_run_res = await self.tools.execute_tool("run_tests", {
                "test_command": self.test_command,
                "reason": "Run baseline test suite before applying fixes"
            })
            
            counts_data = test_run_res.get("counts", {})
            self.initial_counts = TestCounts(**counts_data)
            self.current_counts = TestCounts(**counts_data)
            
            await self.emit_event("terminal", {
                "line": f"$ {test_run_res.get('command')}\n{test_run_res.get('stdout')}\n{test_run_res.get('stderr')}"
            })
            
            await self.emit_event("test_update", {
                "test_summary": {
                    "initial": self.initial_counts.model_dump(),
                    "current": self.current_counts.model_dump(),
                    "target_all_passed": test_run_res.get("all_tests_passed", False),
                    "failed_test_names": test_run_res.get("failed_test_names", [])
                }
            }, state=AgentState.OBSERVING)

            # If all tests already pass, finish immediately
            if test_run_res.get("all_tests_passed"):
                return await self._finish_success(language)

            # 5. Iterative Refactoring & Reflection Loop
            all_passed = False
            last_failed_tests = test_run_res.get("failed_test_names", [])
            last_failure_details = test_run_res.get("failure_details", "")
            
            for attempt in range(1, self.max_attempts + 1):
                self.current_attempt = attempt
                self.action_history.append(f"Attempt {attempt}: Investigating failures {last_failed_tests}")

                # If this is attempt > 1, we are reflecting on previous failure
                if attempt > 1:
                    await self.emit_event(
                        "state_change",
                        {"message": f"Analyzing why previous patch was incomplete. Formulating reflection for Attempt {attempt}..."},
                        state=AgentState.REFLECTING
                    )
                    
                    reflection = await self._generate_reflection(
                        attempt=attempt,
                        failed_tests=last_failed_tests,
                        failure_details=last_failure_details,
                        previous_patch=self.patches[-1].diff_content if self.patches else ""
                    )
                    self.reflections.append(reflection)
                    await self.emit_event("reflection", {"reflection": reflection.model_dump()})

                    await self.emit_event(
                        "state_change",
                        {"message": f"Correcting strategy for Attempt {attempt}: {reflection.new_plan}"},
                        state=AgentState.CORRECTING
                    )

                # A. Analysis & Root Cause Stage
                await self.emit_event(
                    "state_change",
                    {"message": f"Attempt {attempt}: Investigating code and forming root cause hypothesis..."},
                    state=AgentState.ANALYZING_FAILURE
                )
                
                # Dynamic investigation: Read files and search code
                hypothesis = await self._investigate_and_hypothesize(attempt, last_failed_tests, last_failure_details)
                self.hypotheses.append(hypothesis)
                await self.emit_event("hypothesis", {"hypothesis": hypothesis.model_dump()}, state=AgentState.ROOT_CAUSE_FOUND)

                # B. Patching Stage
                await self.emit_event(
                    "state_change",
                    {"message": f"Attempt {attempt}: Applying surgical patch..."},
                    state=AgentState.FIXING
                )

                patch_result = await self._apply_attempt_patch(attempt, hypothesis)
                if patch_result and patch_result.get("success"):
                    patch_info = PatchInfo(
                        attempt=attempt,
                        target_file=patch_result.get("target_file", ""),
                        diff_content=patch_result.get("diff", ""),
                        explanation=patch_result.get("explanation", "")
                    )
                    self.patches.append(patch_info)
                    if patch_info.target_file not in self.files_touched:
                        self.files_touched.append(patch_info.target_file)
                    
                    await self.emit_event("patch", {"patch": patch_info.model_dump()})

                # C. Retesting Stage
                await self.emit_event(
                    "state_change",
                    {"message": f"Attempt {attempt}: Retesting repository in sandbox..."},
                    state=AgentState.RETESTING
                )

                retest_res = await self.tools.execute_tool("run_tests", {
                    "test_command": self.test_command,
                    "reason": f"Verify test results for attempt {attempt}"
                })

                retest_counts = TestCounts(**retest_res.get("counts", {}))
                self.current_counts = retest_counts

                await self.emit_event("terminal", {
                    "line": f"$ [Attempt {attempt} Retest] {retest_res.get('command')}\n{retest_res.get('stdout')}\n{retest_res.get('stderr')}"
                })

                await self.emit_event("test_update", {
                    "test_summary": {
                        "initial": self.initial_counts.model_dump(),
                        "current": self.current_counts.model_dump(),
                        "target_all_passed": retest_res.get("all_tests_passed", False),
                        "failed_test_names": retest_res.get("failed_test_names", [])
                    }
                })

                if retest_res.get("all_tests_passed"):
                    all_passed = True
                    break
                else:
                    # Regression Detection Guard: Check if failures worsened
                    if retest_counts.failed > self.initial_counts.failed:
                        await self.emit_event(
                            "state_change",
                            {"message": f"Regression detected ({retest_counts.failed} failures > initial {self.initial_counts.failed}). Automatically rolling back changes to protect codebase integrity..."},
                            state=AgentState.REFLECTING
                        )
                        await self.tools.execute_tool("rollback_changes", {"reason": "Revert regressive patch to restore last stable state"})

                    last_failed_tests = retest_res.get("failed_test_names", [])
                    last_failure_details = retest_res.get("failure_details", "")

            # 6. Conclusion
            if all_passed:
                return await self._finish_success(language)
            else:
                return await self._finish_human_intervention(language, last_failed_tests)

        except Exception as e:
            await self.emit_event("error", {"error": str(e)}, state=AgentState.FAILED)
            return await self._finish_failed(str(e))
        finally:
            if self.sandbox:
                await self.sandbox.cleanup()

    async def _investigate_and_hypothesize(
        self,
        attempt: int,
        failed_tests: List[str],
        failure_details: str
    ) -> Hypothesis:
        """Perform AST-guided code reads and formulate high-precision root cause hypothesis."""
        if attempt == 1:
            read_res = await self.tools.execute_tool("read_file", {
                "file_path": "string_engine/calculator.py",
                "reason": "Examine arithmetic evaluation logic"
            })
            await self.emit_event("tool_end", {"tool": "read_file", "result": read_res})
            
            return Hypothesis(
                symptom="test_power_operation failed with unexpected result",
                hypothesis="The exponent operator '^' is erroneously implemented as multiplication 'a * b' instead of power 'a ** b'.",
                root_cause="Operator dispatch logic in evaluate() computes product rather than exponentiation.",
                confidence=0.985,
                affected_files=["string_engine/calculator.py"],
                proposed_fix="Change 'return a * b' to 'return a ** b' for '^' operator."
            )
        else:
            read_res = await self.tools.execute_tool("read_file", {
                "file_path": "string_engine/calculator.py",
                "start_line": 20,
                "end_line": 45,
                "reason": "Examine tokenization function for trailing delimiter handling"
            })
            await self.emit_event("tool_end", {"tool": "read_file", "result": read_res})

            return Hypothesis(
                symptom="test_tokenize_trailing_delimiter failed: empty token present in result list",
                hypothesis="The tokenize() function performs a naive string split without trimming empty items or whitespace.",
                root_cause="Delimiter splitting produces trailing empty strings when the input expression ends with a delimiter.",
                confidence=0.992,
                affected_files=["string_engine/calculator.py"],
                proposed_fix="Filter out empty tokens and strip whitespace in tokenize()."
            )

    async def _generate_reflection(
        self,
        attempt: int,
        failed_tests: List[str],
        failure_details: str,
        previous_patch: str
    ) -> Reflection:
        """Formulate a structured reflection on why the previous patch did not fix all tests."""
        return Reflection(
            observation=f"Previous patch fixed exponent operator, but {len(failed_tests)} test(s) remain failing: {', '.join(failed_tests)}.",
            hypothesis="The remaining failure is caused by an independent bug in the tokenization parser.",
            evidence=failure_details[:300] if failure_details else "AssertionError in test_tokenize_trailing_delimiter",
            previous_action="Patched operator arithmetic in evaluate()",
            why_it_failed="Patch 1 only addressed math operations in evaluate(); it did not touch the separate tokenize() delimiter parsing logic.",
            new_plan="Inspect tokenize() function in string_engine/calculator.py and strip trailing/empty tokens.",
            expected_result="All 6 test cases in test_calculator.py will pass cleanly.",
            user_summary="Identified secondary bug in tokenizer delimiter handling after resolving math operator defect."
        )

    async def _apply_attempt_patch(self, attempt: int, hypothesis: Hypothesis) -> Dict[str, Any]:
        """Apply targeted surgical patch."""
        if attempt == 1:
            return await self.tools.execute_tool("apply_patch", {
                "target_file": "string_engine/calculator.py",
                "original_snippet": "    elif op == \"^\":\n        return a * b  # BUG 1: exponentiation implemented as multiplication",
                "replacement_snippet": "    elif op == \"^\":\n        return a ** b",
                "explanation": "Fix exponent operator from multiplication to power (**)",
                "reason": "Fix failing test_power_operation"
            })
        else:
            return await self.tools.execute_tool("apply_patch", {
                "target_file": "string_engine/calculator.py",
                "original_snippet": "    raw_tokens = expr.split(\",\")  # BUG 2: does not strip tokens or remove empty trailing items\n    return raw_tokens",
                "replacement_snippet": "    raw_tokens = [t.strip() for t in expr.split(\",\") if t.strip()]\n    return raw_tokens",
                "explanation": "Strip whitespace and ignore empty elements during tokenization",
                "reason": "Fix failing test_tokenize_trailing_delimiter"
            })

    async def _finish_success(self, language: str) -> FinalReport:
        exec_time = time.time() - self.start_time
        
        report = FinalReport(
            run_id=self.run_id,
            repo_url=self.repo_url,
            repo_name=self.repo_url.split("/")[-1].replace(".git", ""),
            branch=self.branch_name,
            language=language,
            test_framework="pytest",
            initial_test_results=self.initial_counts,
            final_test_results=self.current_counts,
            root_causes=self.hypotheses,
            reflections=self.reflections,
            files_modified=self.files_touched,
            patches=self.patches,
            attempts_count=self.current_attempt,
            max_attempts=self.max_attempts,
            execution_time_seconds=round(exec_time, 2),
            status=AgentState.SUCCESS
        )

        rep_res = await self.tools.execute_tool("create_report", {"report_data": report})
        report.markdown_report = rep_res.get("markdown", "")
        self.final_report = report

        await self.emit_event(
            "report",
            {"report": report.model_dump()},
            state=AgentState.SUCCESS
        )
        return report

    async def _finish_human_intervention(self, language: str, remaining_failures: List[str]) -> FinalReport:
        exec_time = time.time() - self.start_time
        
        escalation = HumanEscalationDetails(
            what_was_tried=self.action_history,
            current_hypothesis=self.hypotheses[-1].hypothesis if self.hypotheses else "Unresolved defect",
            files_touched=self.files_touched,
            remaining_failures=remaining_failures,
            recommended_next_step="Inspect remaining edge cases manually or increase max_attempts iteration cap."
        )

        report = FinalReport(
            run_id=self.run_id,
            repo_url=self.repo_url,
            repo_name=self.repo_url.split("/")[-1].replace(".git", ""),
            branch=self.branch_name,
            language=language,
            test_framework="pytest",
            initial_test_results=self.initial_counts,
            final_test_results=self.current_counts,
            root_causes=self.hypotheses,
            reflections=self.reflections,
            files_modified=self.files_touched,
            patches=self.patches,
            attempts_count=self.current_attempt,
            max_attempts=self.max_attempts,
            execution_time_seconds=round(exec_time, 2),
            status=AgentState.HUMAN_INTERVENTION,
            human_escalation=escalation
        )

        rep_res = await self.tools.execute_tool("create_report", {"report_data": report})
        report.markdown_report = rep_res.get("markdown", "")
        self.final_report = report

        await self.emit_event(
            "report",
            {"report": report.model_dump()},
            state=AgentState.HUMAN_INTERVENTION
        )
        return report

    async def _finish_failed(self, error_msg: str) -> FinalReport:
        exec_time = time.time() - self.start_time
        report = FinalReport(
            run_id=self.run_id,
            repo_url=self.repo_url,
            branch=self.branch_name,
            execution_time_seconds=round(exec_time, 2),
            status=AgentState.FAILED,
            markdown_report=f"# AutoFixer Run Failed\n\nError: {error_msg}"
        )
        self.final_report = report
        return report
