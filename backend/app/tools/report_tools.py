from typing import Dict, Any, List, Optional
from ..models.report import FinalReport, HumanEscalationDetails
from ..models.events import TestCounts, PatchInfo, Hypothesis, Reflection
from ..models.agent_state import AgentState


def generate_markdown_report(report: FinalReport) -> str:
    """Generate rich GitHub-flavored markdown summary for the run."""
    status_badge = "✅ **PASSED / RESOLVED**" if report.status == AgentState.SUCCESS else (
        "⚠️ **HUMAN INTERVENTION REQUIRED**" if report.status == AgentState.HUMAN_INTERVENTION else "❌ **FAILED**"
    )
    
    init_passed = report.initial_test_results.passed if report.initial_test_results else 0
    init_failed = report.initial_test_results.failed if report.initial_test_results else 0
    init_total = report.initial_test_results.total if report.initial_test_results else 0

    fin_passed = report.final_test_results.passed if report.final_test_results else 0
    fin_failed = report.final_test_results.failed if report.final_test_results else 0
    fin_total = report.final_test_results.total if report.final_test_results else 0

    lines = [
        f"# AutoFixer AI — Autonomous Post-Mortem Report",
        f"",
        f"**Status:** {status_badge}  ",
        f"**Repository:** `{report.repo_url}`  ",
        f"**Branch:** `{report.branch}`  ",
        f"**Language / Test Framework:** {report.language} ({report.test_framework})  ",
        f"**Attempts Used:** {report.attempts_count} / {report.max_attempts}  ",
        f"**Total Execution Time:** {report.execution_time_seconds:.2f}s  ",
        f"",
        f"---",
        f"",
        f"## 1. Test Suite Results Delta",
        f"",
        f"| Metric | Initial State | Final State | Delta |",
        f"| :--- | :--- | :--- | :--- |",
        f"| **Total Tests** | {init_total} | {fin_total} | {fin_total - init_total:+d} |",
        f"| **Passed** | {init_passed} | {fin_passed} | **{fin_passed - init_passed:+d}** |",
        f"| **Failed** | {init_failed} | {fin_failed} | **{fin_failed - init_failed:+d}** |",
        f"",
        f"---",
        f"",
        f"## 2. Root Cause Analysis & Hypotheses",
        f""
    ]

    if report.root_causes:
        for idx, rc in enumerate(report.root_causes, 1):
            lines.extend([
                f"### Root Cause #{idx}",
                f"- **Symptom:** {rc.symptom}",
                f"- **Hypothesis:** {rc.hypothesis}",
                f"- **Identified Root Cause:** {rc.root_cause}",
                f"- **Confidence:** {int(rc.confidence * 100)}%",
                f"- **Affected Files:** {', '.join(f'`{f}`' for f in rc.affected_files) if rc.affected_files else 'N/A'}",
                f""
            ])
    else:
        lines.append("_No explicit root cause entries recorded._\n")

    lines.extend([
        f"---",
        f"",
        f"## 3. Reflection & Self-Correction History",
        f""
    ])

    if report.reflections:
        for idx, ref in enumerate(report.reflections, 1):
            lines.extend([
                f"### Reflection Cycle #{idx}",
                f"- **Observation:** {ref.observation}",
                f"- **Previous Action:** {ref.previous_action}",
                f"- **Why It Failed:** {ref.why_it_failed}",
                f"- **Corrective Plan:** {ref.new_plan}",
                f"- **Expected Outcome:** {ref.expected_result}",
                f""
            ])
    else:
        lines.append("_Fixed on first attempt without requiring reflection iteration._\n")

    lines.extend([
        f"---",
        f"",
        f"## 4. Applied Patches & Diffs",
        f""
    ])

    if report.patches:
        for idx, p in enumerate(report.patches, 1):
            lines.extend([
                f"### Patch #{idx} (Attempt {p.attempt}): `{p.target_file}`",
                f"_{p.explanation}_",
                f"```diff",
                f"{p.diff_content}",
                f"```",
                f""
            ])
    else:
        lines.append("_No code patches applied._\n")

    if report.human_escalation:
        lines.extend([
            f"---",
            f"",
            f"## ⚠️ Human Escalation Summary",
            f"",
            f"- **What Was Tried:**",
        ])
        for step in report.human_escalation.what_was_tried:
            lines.append(f"  - {step}")
        lines.extend([
            f"- **Current Hypothesis:** {report.human_escalation.current_hypothesis}",
            f"- **Files Touched:** {', '.join(f'`{f}`' for f in report.human_escalation.files_touched)}",
            f"- **Remaining Failures:** {', '.join(f'`{f}`' for f in report.human_escalation.remaining_failures)}",
            f"- **Recommended Next Step:** {report.human_escalation.recommended_next_step}",
            f""
        ])

    return "\n".join(lines)


async def create_report(
    report_data: FinalReport,
    reason: str = "Generate final post-mortem report"
) -> Dict[str, Any]:
    """Compile final structured report and markdown."""
    report_data.markdown_report = generate_markdown_report(report_data)
    return {
        "success": True,
        "report": report_data.model_dump(),
        "markdown": report_data.markdown_report,
        "target": "final_report",
        "reason": reason
    }
