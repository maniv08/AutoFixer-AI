import pytest
from app.agent.orchestrator import AgentOrchestrator
from app.demo.demo_generator import create_ephemeral_demo_copy
from app.models.agent_state import AgentState


@pytest.mark.asyncio
async def test_full_orchestrator_autonomous_loop():
    demo_dir = create_ephemeral_demo_copy()
    
    events_collected = []
    
    async def collect_event(evt):
        events_collected.append(evt)

    orchestrator = AgentOrchestrator(
        run_id="test_run_123",
        repo_url=demo_dir,
        branch_name="autofixer/test-attempt",
        max_attempts=3,
        event_callback=collect_event
    )

    report = await orchestrator.run()

    # Verify report results
    assert report.status == AgentState.SUCCESS
    assert report.initial_test_results.failed == 2
    assert report.final_test_results.failed == 0
    assert report.final_test_results.passed == 6
    assert len(report.patches) == 2
    assert len(report.reflections) >= 1  # Verify visible reflection occurred between attempt 1 and 2
    assert len(events_collected) > 10
