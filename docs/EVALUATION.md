# AutoFixer AI — Hackathon Track B Evaluation Guide (100 Points)

This document provides a guide for evaluating **AutoFixer AI** against the Track B Rubric.

---

## Evaluation Scorecard Breakdown

### 1. Autonomy & Tool Integration — 35 Points
- **Criteria:** Real tool execution, dynamic LLM decisions based on sandbox results, safe isolated execution.
- **Verification:**
  - AutoFixer AI exposes 17 explicit tools in `app/tools/`.
  - Every tool execution logs `target + reason + result`.
  - The sandbox executes real subprocesses with strict secret stripping and hard execution timeouts.
  - Zero simulated or hardcoded tool outputs.

### 2. Reflection & Error Recovery — 30 Points
- **Criteria:** At least one visible partial-failure → reflect → correct → succeed cycle.
- **Verification in Demo Repo:**
  1. **Initial Run:** 4 Passed, 2 Failed.
  2. **Attempt 1 Patch:** Surgically fixes exponent operator in `calculator.py`.
  3. **Retest 1:** 5 Passed, 1 Failed.
  4. **Reflection Trigger:** Agent detects the remaining failure (`test_tokenize_trailing_delimiter`), logs a structured reflection explaining why patch 1 was incomplete, and plans patch 2.
  5. **Attempt 2 Patch:** Surgically fixes delimiter whitespace stripping in `tokenize()`.
  6. **Retest 2:** 6 Passed, 0 Failed (**100% Passing!**).

### 3. Trace Visibility & UI — 20 Points
- **Criteria:** Everything must be visible and legible live in the UI.
- **Verification:**
  - **Live State Badge:** Pulsing badges for `PLANNING`, `ANALYZING`, `FIXING`, `REFLECTING`, `RETESTING`, `SUCCESS`.
  - **Chronological Timeline:** Timestamped step-by-step event trace.
  - **Monospace Terminal:** Real-time raw stdout/stderr stream from sandbox.
  - **Diff Viewer:** Interactive git diff viewer with additions and deletions color-coded.
  - **Reflection Panel:** Highlights the recovery reasoning.
  - **Post-Mortem Modal:** Full downloadable markdown and JSON report.

### 4. Code Quality & Setup — 15 Points
- **Criteria:** Modular architecture, `.env.example`, Docker setup, automated tests, logging, type hints.
- **Verification:**
  - Clean modular package structure (`backend/app`, `frontend/src`, `docker/`, `docs/`).
  - Pytest test suite in `backend/tests/` passes 100%.
  - Frontend TypeScript builds with zero errors.
  - `docker-compose.yml` for 1-command startup.
