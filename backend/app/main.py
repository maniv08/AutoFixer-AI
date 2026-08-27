import asyncio
import json
import logging
import uuid
from typing import Dict, List, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .config import settings
from .models.agent_state import AgentState
from .models.events import AgentEvent
from .models.report import FinalReport
from .agent.orchestrator import AgentOrchestrator
from .demo.demo_generator import get_demo_repo_path, create_ephemeral_demo_copy

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("autofixer.api")

app = FastAPI(
    title="AutoFixer AI — Autonomous Software QA & Refactoring Agent",
    version="1.0.0",
    description="Autonomous agent for finding root causes, generating surgical patches, running tests in sandboxes, and self-correcting via reflection."
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r"^https?:\/\/.*$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# In-memory run repository & active WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, run_id: str, websocket: WebSocket):
        await websocket.accept()
        if run_id not in self.active_connections:
            self.active_connections[run_id] = []
        self.active_connections[run_id].append(websocket)

    def disconnect(self, run_id: str, websocket: WebSocket):
        if run_id in self.active_connections:
            if websocket in self.active_connections[run_id]:
                self.active_connections[run_id].remove(websocket)
            if not self.active_connections[run_id]:
                del self.active_connections[run_id]

    async def broadcast(self, run_id: str, event: AgentEvent):
        if run_id in self.active_connections:
            event_json = event.model_dump_json()
            disconnected = []
            for connection in self.active_connections[run_id]:
                try:
                    await connection.send_text(event_json)
                except Exception:
                    disconnected.append(connection)
            for dead in disconnected:
                self.disconnect(run_id, dead)


manager = ConnectionManager()
runs_store: Dict[str, Dict] = {}


class RunRequest(BaseModel):
    repo_url: Optional[str] = None
    branch_name: str = "autofixer/attempt-main"
    test_command: Optional[str] = None
    max_attempts: int = Field(default=5, ge=1, le=10)
    is_demo: bool = False


class RunResponse(BaseModel):
    run_id: str
    status: AgentState
    message: str


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "AutoFixer AI Backend",
        "llm_provider": settings.LLM_PROVIDER,
        "model_name": settings.MODEL_NAME,
        "sandbox_type": settings.SANDBOX_TYPE,
        "max_iterations_default": settings.MAX_ITERATIONS
    }


@app.get("/api/demo-repo")
async def get_demo_info():
    demo_path = get_demo_repo_path()
    return {
        "demo_available": True,
        "demo_repo_path": demo_path,
        "description": "Seeded Python Math & Tokenizer engine with 2 multi-stage bugs for evaluation",
        "seeded_tests_count": 6,
        "expected_initial_failures": 2
    }


async def execute_agent_run(run_id: str, request: RunRequest, target_repo_path: str):
    """Background task running the orchestrator."""
    try:
        async def event_handler(event: AgentEvent):
            # Store latest events in memory
            if run_id in runs_store:
                runs_store[run_id]["events"].append(event.model_dump())
                runs_store[run_id]["state"] = event.state
                if event.event_type == "test_update":
                    runs_store[run_id]["test_summary"] = event.data.get("test_summary")
                elif event.event_type == "patch":
                    runs_store[run_id]["patches"].append(event.data.get("patch"))
                elif event.event_type == "hypothesis":
                    runs_store[run_id]["hypotheses"].append(event.data.get("hypothesis"))
                elif event.event_type == "reflection":
                    runs_store[run_id]["reflections"].append(event.data.get("reflection"))
            
            # Stream live via WebSocket
            await manager.broadcast(run_id, event)

        orchestrator = AgentOrchestrator(
            run_id=run_id,
            repo_url=target_repo_path,
            branch_name=request.branch_name,
            test_command=request.test_command,
            max_attempts=request.max_attempts,
            event_callback=event_handler
        )

        final_report = await orchestrator.run()
        if run_id in runs_store:
            runs_store[run_id]["final_report"] = final_report.model_dump()
            runs_store[run_id]["state"] = final_report.status

    except Exception as e:
        logger.error(f"Error in run {run_id}: {e}", exc_info=True)
        if run_id in runs_store:
            runs_store[run_id]["state"] = AgentState.FAILED
            runs_store[run_id]["error"] = str(e)
            
        error_event = AgentEvent(
            event_id=f"evt_{uuid.uuid4().hex[:8]}",
            run_id=run_id,
            timestamp=datetime.now(timezone.utc).isoformat(),
            event_type="error",
            state=AgentState.FAILED,
            attempt=1,
            data={"error": str(e), "message": f"Execution halted: {str(e)}"}
        )
        await manager.broadcast(run_id, error_event)


@app.post("/api/run", response_model=RunResponse)
async def start_run(request: RunRequest, background_tasks: BackgroundTasks):
    run_id = f"run_{uuid.uuid4().hex[:12]}"
    
    # Determine repo path: if demo requested or placeholder demo URL provided, use seeded demo
    is_demo_url = request.repo_url and ("autofixer/demo" in request.repo_url or request.repo_url.strip() in ["demo", "demo-repo"])
    if request.is_demo or not request.repo_url or is_demo_url:
        target_repo = create_ephemeral_demo_copy()
    else:
        target_repo = request.repo_url

    runs_store[run_id] = {
        "run_id": run_id,
        "repo_url": target_repo,
        "branch_name": request.branch_name,
        "test_command": request.test_command,
        "max_attempts": request.max_attempts,
        "state": AgentState.PLANNING,
        "events": [],
        "patches": [],
        "hypotheses": [],
        "reflections": [],
        "test_summary": None,
        "final_report": None,
        "error": None
    }

    # Start background task
    background_tasks.add_task(execute_agent_run, run_id, request, target_repo)

    return RunResponse(
        run_id=run_id,
        status=AgentState.PLANNING,
        message="AutoFixer QA refactoring run started."
    )


@app.get("/api/runs/{run_id}")
async def get_run_status(run_id: str):
    if run_id not in runs_store:
        raise HTTPException(status_code=404, detail="Run not found.")
    return runs_store[run_id]


@app.websocket("/ws/runs/{run_id}")
async def websocket_endpoint(websocket: WebSocket, run_id: str):
    await manager.connect(run_id, websocket)
    try:
        # Send historical events if any exist
        if run_id in runs_store:
            for past_evt in runs_store[run_id]["events"]:
                await websocket.send_text(json.dumps(past_evt))
        
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
            # Handle potential client heartbeats
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(run_id, websocket)
    except Exception:
        manager.disconnect(run_id, websocket)
