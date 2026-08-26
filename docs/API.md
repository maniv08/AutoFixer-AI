# AutoFixer AI — API Specifications

## REST API Endpoints

### 1. Health Check
- **Endpoint:** `GET /api/health`
- **Response:**
  ```json
  {
    "status": "healthy",
    "service": "AutoFixer AI Backend",
    "llm_provider": "gemini",
    "model_name": "gemini-2.0-flash",
    "sandbox_type": "process",
    "max_iterations_default": 5
  }
  ```

### 2. Start QA & Refactoring Run
- **Endpoint:** `POST /api/run`
- **Request Body:**
  ```json
  {
    "repo_url": "https://github.com/autofixer/demo-repo",
    "branch_name": "autofixer/attempt-main",
    "test_command": "pytest -v",
    "max_attempts": 5,
    "is_demo": true
  }
  ```
- **Response:**
  ```json
  {
    "run_id": "run_9a8b7c6d5e4f",
    "status": "PLANNING",
    "message": "AutoFixer QA refactoring run started."
  }
  ```

### 3. Get Run Status & History
- **Endpoint:** `GET /api/runs/{run_id}`
- **Response:** Complete JSON state including current state, patches, hypotheses, reflections, and final report.

### 4. Demo Repository Info
- **Endpoint:** `GET /api/demo-repo`
- **Response:** Details of the pre-packaged dual-stage bug demo repo.

---

## WebSocket API

### Live Stream Endpoint
- **URL:** `ws://localhost:8000/ws/runs/{run_id}`
- **Protocol:** JSON message stream of typed `AgentEvent` objects.

#### Event Schema:
```json
{
  "event_id": "evt_1a2b3c4d",
  "run_id": "run_9a8b7c6d5e4f",
  "event_type": "state_change | tool_start | tool_end | terminal | test_update | patch | hypothesis | reflection | report | error",
  "timestamp": "2026-08-26T05:30:00Z",
  "state": "REFLECTING",
  "attempt": 2,
  "data": { ... }
}
```
