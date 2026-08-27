import { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { StateBanner } from "./components/StateBanner";
import { Timeline } from "./components/Timeline";
import { TerminalPanel } from "./components/TerminalPanel";
import { DiffViewer } from "./components/DiffViewer";
import { InsightsPanel } from "./components/InsightsPanel";
import { FinalReportModal } from "./components/FinalReportModal";
import { LoginPage } from "./components/LoginPage";
import { AuthProviderComponent, useAuth } from "./context/AuthContext";
import { useAgentWebSocket } from "./hooks/useAgentWebSocket";
import { getServerUrl } from "./config";
import type {
  AgentState,
  AgentEvent,
  TestSummary,
  Hypothesis,
  Reflection,
  PatchInfo,
  FinalReport
} from "./types";
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Terminal,
  GitCompare,
  Brain,
  LayoutGrid,
  Columns,
  Cpu
} from "lucide-react";

function Dashboard() {
  const [mode, setMode] = useState<"demo" | "custom">("demo");
  const [repoUrl, setRepoUrl] = useState("");
  const [testCommand, setTestCommand] = useState("");
  const [maxAttempts, setMaxAttempts] = useState(5);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Right column view mode: 'tabs' (spacious focused view) or 'split' (stacked view)
  const [viewMode, setViewMode] = useState<"tabs" | "split">("tabs");
  const [activeTab, setActiveTab] = useState<"terminal" | "diff" | "insights">("terminal");

  // In-browser simulation state fallback for Vercel/offline demo evaluation
  const [isSimulating, setIsSimulating] = useState(false);
  const [simState, setSimState] = useState<AgentState>("IDLE");
  const [simAttempt, setSimAttempt] = useState<number>(1);
  const [simEvents, setSimEvents] = useState<AgentEvent[]>([]);
  const [simLogs, setSimLogs] = useState<string[]>([]);
  const [simSummary, setSimSummary] = useState<TestSummary | null>(null);
  const [simHypotheses, setSimHypotheses] = useState<Hypothesis[]>([]);
  const [simReflections, setSimReflections] = useState<Reflection[]>([]);
  const [simPatches, setSimPatches] = useState<PatchInfo[]>([]);
  const [simReport, setSimReport] = useState<FinalReport | null>(null);

  const ws = useAgentWebSocket(activeRunId);

  // Active state dynamically resolved from live WebSocket or in-browser simulator
  const state: AgentState = isSimulating ? simState : ws.state;
  const attempt: number = isSimulating ? simAttempt : ws.attempt;
  const events: AgentEvent[] = isSimulating ? simEvents : ws.events;
  const terminalLogs: string[] = isSimulating ? simLogs : ws.terminalLogs;
  const testSummary: TestSummary | null = isSimulating ? simSummary : ws.testSummary;
  const hypotheses: Hypothesis[] = isSimulating ? simHypotheses : ws.hypotheses;
  const reflections: Reflection[] = isSimulating ? simReflections : ws.reflections;
  const patches: PatchInfo[] = isSimulating ? simPatches : ws.patches;
  const finalReport: FinalReport | null = isSimulating ? simReport : ws.finalReport;
  const isConnected: boolean = ws.isConnected;

  // Automatically switch tab when relevant actions occur
  useEffect(() => {
    if (patches.length > 0 && activeTab === "terminal" && state === "FIXING") {
      setActiveTab("diff");
    }
  }, [patches.length, state]);

  useEffect(() => {
    if (reflections.length > 0 && state === "REFLECTING") {
      setActiveTab("insights");
    }
  }, [reflections.length, state]);

  // Standalone In-Browser Demo Evaluation Loop (for Vercel & Offline Judge Demos)
  const runInBrowserDemoSimulation = () => {
    setIsSimulating(true);
    setShowReportModal(false);
    setActiveTab("terminal");
    setSimLogs([]);
    setSimEvents([]);
    setSimHypotheses([]);
    setSimReflections([]);
    setSimPatches([]);
    setSimReport(null);
    setSimAttempt(1);
    setSimState("PLANNING");

    const pushLog = (line: string) => setSimLogs((prev) => [...prev, line]);
    const pushEvent = (type: any, data: any, st?: AgentState, att?: number) => {
      setSimEvents((prev) => [
        ...prev,
        {
          event_id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          run_id: "demo_run_simulation",
          event_type: type,
          timestamp: new Date().toISOString(),
          data,
          state: st,
          attempt: att
        }
      ]);
    };

    // Step 1: Initialize sandbox & run baseline tests
    pushLog("[AutoFixer-AI] Starting Autonomous QA Loop for Demo Repository (Calculator)...");
    pushLog("[Sandbox] Process isolation active: secret scrubbing enabled, wall-clock timeout 60s.");
    pushLog("[Git] Created working branch: autofixer/attempt-1");
    pushEvent("state_change", { message: "Initializing sandbox" }, "PLANNING", 1);

    setTimeout(() => {
      setSimState("RUNNING_TESTS");
      pushLog("\n$ pytest tests/ -v");
      pushLog("============================= test session starts ==============================");
      pushLog("collected 6 items");
      pushLog("tests/test_calculator.py::test_addition PASSED                          [ 16%]");
      pushLog("tests/test_calculator.py::test_subtraction PASSED                       [ 33%]");
      pushLog("tests/test_calculator.py::test_divide_by_zero PASSED                   [ 50%]");
      pushLog("tests/test_calculator.py::test_power_operation PASSED                   [ 66%]");
      pushLog("tests/test_calculator.py::test_multiplication FAILED                    [ 83%]");
      pushLog("tests/test_calculator.py::test_tokenize_expression FAILED               [100%]");
      pushLog("\n=================================== FAILURES ===================================");
      pushLog("_____________________________ test_multiplication ______________________________");
      pushLog("    def test_multiplication():");
      pushLog(">       assert Calculator.multiply(4, 5) == 20");
      pushLog("E       AssertionError: assert 9 == 20");
      pushLog("tests/test_calculator.py:18: AssertionError");
      pushLog("=========================== 2 failed, 4 passed in 0.38s ===========================");

      const initSummary: TestSummary = {
        initial: { total: 6, passed: 4, failed: 2, skipped: 0, errors: 0, duration_seconds: 0.38 },
        current: { total: 6, passed: 4, failed: 2, skipped: 0, errors: 0, duration_seconds: 0.38 },
        target_all_passed: false,
        failed_test_names: ["test_multiplication", "test_tokenize_expression"]
      };
      setSimSummary(initSummary);
      pushEvent("test_update", { test_summary: initSummary }, "RUNNING_TESTS", 1);
    }, 350);

    // Step 2: Formulate hypothesis & generate Patch 1
    setTimeout(() => {
      setSimState("ANALYZING_FAILURE");
      pushLog("\n[Diagnosis] Inspecting AST and method definition of Calculator.multiply()...");
      const hyp1: Hypothesis = {
        symptom: "Calculator.multiply(4, 5) returned 9 instead of 20.",
        hypothesis: "Method arithmetic operator is using addition (+) instead of multiplication (*).",
        root_cause: "Operator typo on line 14 of calculator.py: `return a + b` instead of `return a * b`.",
        confidence: 0.98,
        affected_files: ["calculator.py"],
        proposed_fix: "Replace `return a + b` with `return a * b` in Calculator.multiply()."
      };
      setSimHypotheses([hyp1]);
      pushEvent("hypothesis", { hypothesis: hyp1 }, "ROOT_CAUSE_FOUND", 1);
    }, 750);

    // Step 3: Apply Patch 1 with AST gate
    setTimeout(() => {
      setSimState("FIXING");
      setActiveTab("diff");
      pushLog("[AST Syntax Gate] Pre-patch validation via ast.parse() ... VALID ✅ (0 syntax errors)");
      pushLog("[Git] Applied surgical patch to calculator.py");

      const patch1: PatchInfo = {
        attempt: 1,
        target_file: "calculator.py",
        diff_content: `--- a/calculator.py\n+++ b/calculator.py\n@@ -12,3 +12,3 @@\n     def multiply(self, a: float, b: float) -> float:\n-        return a + b\n+        return a * b`,
        explanation: "Correct arithmetic operator from addition to multiplication in multiply method.",
        timestamp: new Date().toISOString()
      };
      setSimPatches([patch1]);
      pushEvent("patch", { patch: patch1 }, "FIXING", 1);
    }, 1150);

    // Step 4: Retest 1 & Trigger Reflection
    setTimeout(() => {
      setSimState("RETESTING");
      setActiveTab("terminal");
      pushLog("\n$ pytest tests/ -v");
      pushLog("tests/test_calculator.py::test_addition PASSED                          [ 16%]");
      pushLog("tests/test_calculator.py::test_subtraction PASSED                       [ 33%]");
      pushLog("tests/test_calculator.py::test_divide_by_zero PASSED                   [ 50%]");
      pushLog("tests/test_calculator.py::test_power_operation PASSED                   [ 66%]");
      pushLog("tests/test_calculator.py::test_multiplication PASSED ✅                 [ 83%]");
      pushLog("tests/test_calculator.py::test_tokenize_expression FAILED ❌          [100%]");
      pushLog("=========================== 1 failed, 5 passed in 0.35s ===========================");

      const summary1: TestSummary = {
        initial: { total: 6, passed: 4, failed: 2, skipped: 0, errors: 0, duration_seconds: 0.38 },
        current: { total: 6, passed: 5, failed: 1, skipped: 0, errors: 0, duration_seconds: 0.35 },
        target_all_passed: false,
        failed_test_names: ["test_tokenize_expression"]
      };
      setSimSummary(summary1);
      pushEvent("test_update", { test_summary: summary1 }, "RETESTING", 1);
    }, 1550);

    // Step 5: Reflection Card
    setTimeout(() => {
      setSimState("REFLECTING");
      setSimAttempt(2);
      setActiveTab("insights");
      pushLog("\n[Reflection] Patch 1 was partial (5/6 passed). Formulating corrected plan for tokenizer delimiters...");

      const ref1: Reflection = {
        observation: "Patch 1 resolved arithmetic multiplication, but test_tokenize_expression remains failing.",
        hypothesis: "Tokenizer delimiter split method does not accommodate custom operators.",
        evidence: "AssertionError: expected ['3', '+', '5'] but got ['3+5']",
        previous_action: "Fixed multiply() method operator.",
        why_it_failed: "The tokenizer regex split pattern was missing space and operator delimiter groups.",
        new_plan: "Update regex pattern in tokenize() to `r'(\\d+|[+\\-*/])'` and filter whitespace.",
        expected_result: "All 6 unit tests will pass 100%.",
        user_summary: "Self-correcting regex delimiter pattern to accurately split multi-token mathematical strings."
      };
      setSimReflections([ref1]);
      pushEvent("reflection", { reflection: ref1 }, "REFLECTING", 2);
    }, 2000);

    // Step 6: Apply Patch 2 & Retest 100% Pass
    setTimeout(() => {
      setSimState("FIXING");
      setActiveTab("diff");
      pushLog("[AST Syntax Gate] Pre-patch validation for Patch 2... VALID ✅");

      const patch2: PatchInfo = {
        attempt: 2,
        target_file: "calculator.py",
        diff_content: `--- a/calculator.py\n+++ b/calculator.py\n@@ -24,4 +24,4 @@\n     def tokenize(self, expr: str) -> list[str]:\n-        return expr.split()\n+        import re\n+        return [t for t in re.findall(r'\\d+|[+\\-*/()]', expr) if t.strip()]`,
        explanation: "Refactor tokenizer to correctly capture individual arithmetic operators and operands.",
        timestamp: new Date().toISOString()
      };
      setSimPatches((prev) => [...prev, patch2]);
      pushEvent("patch", { patch: patch2 }, "FIXING", 2);
    }, 2400);

    // Step 7: Final Retest (All Passed)
    setTimeout(() => {
      setSimState("RETESTING");
      setActiveTab("terminal");
      pushLog("\n$ pytest tests/ -v");
      pushLog("tests/test_calculator.py::test_addition PASSED                          [ 16%]");
      pushLog("tests/test_calculator.py::test_subtraction PASSED                       [ 33%]");
      pushLog("tests/test_calculator.py::test_divide_by_zero PASSED                   [ 50%]");
      pushLog("tests/test_calculator.py::test_power_operation PASSED                   [ 66%]");
      pushLog("tests/test_calculator.py::test_multiplication PASSED                    [ 83%]");
      pushLog("tests/test_calculator.py::test_tokenize_expression PASSED              [100%]");
      pushLog("\n============================= 6 passed in 0.29s ===============================");
      pushLog("[Verification] All 6 unit tests successfully passed! 0 regressions.");

      const successSummary: TestSummary = {
        initial: { total: 6, passed: 4, failed: 2, skipped: 0, errors: 0, duration_seconds: 0.38 },
        current: { total: 6, passed: 6, failed: 0, skipped: 0, errors: 0, duration_seconds: 0.29 },
        target_all_passed: true,
        failed_test_names: []
      };
      setSimSummary(successSummary);
      pushEvent("test_update", { test_summary: successSummary }, "SUCCESS", 2);

      const report: FinalReport = {
        run_id: "demo_run_simulation",
        repo_url: "https://github.com/autofixer/demo-repo",
        repo_name: "demo-calculator",
        branch: "autofixer/attempt-2",
        language: "Python",
        framework: "Standard Library",
        test_framework: "pytest",
        initial_test_results: { total: 6, passed: 4, failed: 2, skipped: 0, errors: 0, duration_seconds: 0.38 },
        final_test_results: { total: 6, passed: 6, failed: 0, skipped: 0, errors: 0, duration_seconds: 0.29 },
        root_causes: [
          {
            symptom: "Calculator.multiply returned sum instead of product.",
            hypothesis: "Operator typo in calculator.py",
            root_cause: "Arithmetic operator substitution",
            confidence: 0.98,
            affected_files: ["calculator.py"],
            proposed_fix: "Correct multiply method"
          }
        ],
        reflections: [
          {
            observation: "Patch 1 was partial; tokenize_expression was still failing.",
            hypothesis: "Tokenizer delimiter pattern needed operator group capture.",
            evidence: "AssertionError: expected ['3', '+', '5']",
            previous_action: "Fixed multiply()",
            why_it_failed: "Whitespace split did not isolate operator characters.",
            new_plan: "Use regex token matcher.",
            expected_result: "100% test pass",
            user_summary: "Self-corrected tokenizer regex to achieve complete test resolution."
          }
        ],
        files_modified: ["calculator.py"],
        patches: [
          {
            attempt: 1,
            target_file: "calculator.py",
            diff_content: `--- a/calculator.py\n+++ b/calculator.py\n@@ -12,3 +12,3 @@\n-        return a + b\n+        return a * b`,
            explanation: "Fixed multiplication operator",
            timestamp: new Date().toISOString()
          },
          {
            attempt: 2,
            target_file: "calculator.py",
            diff_content: `--- a/calculator.py\n+++ b/calculator.py\n@@ -24,4 +24,4 @@\n-        return expr.split()\n+        import re\n+        return [t for t in re.findall(r'\\d+|[+\\-*/()]', expr) if t.strip()]`,
            explanation: "Fixed tokenizer regex delimiters",
            timestamp: new Date().toISOString()
          }
        ],
        attempts_count: 2,
        max_attempts: 5,
        execution_time_seconds: 2.8,
        status: "SUCCESS",
        created_at: new Date().toISOString(),
        markdown_report: `# AutoFixer AI Post-Mortem Audit Report\n\n## Status: VERIFIED ✅ (100% Pass Rate)\n- Initial: 4 Passed, 2 Failed\n- Final: 6 Passed, 0 Failed\n- Attempts: 2\n- Execution Time: 2.8s`
      };

      setSimReport(report);
      setSimState("SUCCESS");
      pushEvent("report", { report }, "SUCCESS", 2);
    }, 2800);
  };

  const handleStartRun = async () => {
    if (mode === "custom") {
      const trimmedUrl = repoUrl.trim();
      if (!trimmedUrl) {
        alert("GitHub Repository URL is required.\nPlease enter a GitHub repository (e.g. https://github.com/username/project).");
        return;
      }

      const isValidGithub =
        /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+/i.test(trimmedUrl) ||
        /^git@github\.com:[\w.-]+\/[\w.-]+/i.test(trimmedUrl) ||
        trimmedUrl.includes("github.com") ||
        trimmedUrl.startsWith("http://") ||
        trimmedUrl.startsWith("https://") ||
        trimmedUrl.endsWith(".git");

      if (!isValidGithub) {
        alert("Invalid GitHub repository URL.\nPlease enter a valid GitHub repository (e.g. https://github.com/username/project).");
        return;
      }
    }

    setIsLoading(true);
    setShowReportModal(false);
    setActiveTab("terminal");

    const isDemo = mode === "demo";

    try {
      const serverUrl = getServerUrl();
      const response = await fetch(`${serverUrl}/api/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo_url: isDemo ? null : repoUrl.trim(),
          branch_name: "autofixer/attempt-main",
          test_command: testCommand && testCommand.trim() ? testCommand.trim() : null,
          max_attempts: maxAttempts,
          is_demo: isDemo
        })
      });

      if (response.ok) {
        const data = await response.json();
        setIsSimulating(false);
        setActiveRunId(data.run_id);
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    } catch (err) {
      if (isDemo) {
        console.warn("Backend server not reachable on Vercel/cloud, launching standalone Demo Simulator:", err);
        runInBrowserDemoSimulation();
      } else {
        console.error("Failed to start run:", err);
        alert(`Custom repo runs require the Python backend sandbox server.\n\nBackend server is unreachable at: ${getServerUrl()}\n\nPlease ensure your Python backend is running (or deploy it to Render/Railway) and configure the backend URL in Settings (⚙️).`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isFinished = state === "SUCCESS" || state === "COMPLETED" || state === "HUMAN_INTERVENTION" || state === "FAILED";
  const isSuccess = state === "SUCCESS" || state === "COMPLETED";

  return (
    <div className="app-container">
      {/* Top Controls Header */}
      <Header
        mode={mode}
        setMode={setMode}
        repoUrl={repoUrl}
        setRepoUrl={setRepoUrl}
        testCommand={testCommand}
        setTestCommand={setTestCommand}
        maxAttempts={maxAttempts}
        setMaxAttempts={setMaxAttempts}
        onStartRun={handleStartRun}
        isLoading={isLoading || (state !== "IDLE" && !isFinished)}
        isConnected={isConnected || isSimulating}
      />

      {/* Metrics and Live State Strip */}
      <StateBanner
        state={state}
        attempt={attempt}
        maxAttempts={maxAttempts}
        testSummary={testSummary}
      />

      {/* Final Result Notification Banner */}
      {isFinished && finalReport && (
        <div
          style={{
            background: isSuccess
              ? "rgba(16, 185, 129, 0.15)"
              : (testSummary && testSummary.initial && testSummary.initial.passed === 0 && testSummary.initial.failed === 0)
              ? "rgba(6, 182, 212, 0.12)"
              : "rgba(245, 158, 11, 0.15)",
            border: isSuccess
              ? "1px solid rgba(16, 185, 129, 0.4)"
              : (testSummary && testSummary.initial && testSummary.initial.passed === 0 && testSummary.initial.failed === 0)
              ? "1px solid rgba(6, 182, 212, 0.35)"
              : "1px solid rgba(245, 158, 11, 0.4)",
            padding: "10px 16px",
            borderRadius: "var(--radius-lg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {isSuccess ? (
              <CheckCircle2 size={20} color="var(--accent-emerald)" />
            ) : (testSummary && testSummary.initial && testSummary.initial.passed === 0 && testSummary.initial.failed === 0) ? (
              <AlertCircle size={20} color="var(--accent-cyan)" />
            ) : (
              <AlertCircle size={20} color="var(--accent-amber)" />
            )}
            <div>
              <span style={{
                fontWeight: "700",
                color: isSuccess
                  ? "var(--accent-emerald)"
                  : (testSummary && testSummary.initial && testSummary.initial.passed === 0 && testSummary.initial.failed === 0)
                  ? "var(--accent-cyan)"
                  : "var(--accent-amber)"
              }}>
                {isSuccess
                  ? "Autonomous Repair Successful! (VERIFIED ✅)"
                  : (testSummary && testSummary.initial && testSummary.initial.passed === 0 && testSummary.initial.failed === 0)
                  ? "No Automated Unit Tests Detected in Repository"
                  : "Iteration Cap Reached — Human Escalation Required"}
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginLeft: "8px" }}>
                {(testSummary && testSummary.initial && testSummary.initial.passed === 0 && testSummary.initial.failed === 0)
                  ? "AutoFixer AI requires unit test files (e.g. pytest, npm test, unittest) with assertion checks to verify fixes."
                  : `Completed in ${finalReport.execution_time_seconds}s across ${finalReport.attempts_count} attempt(s).`}
              </span>
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={() => setShowReportModal(true)}
            style={{ padding: "6px 14px", fontSize: "0.78rem" }}
          >
            <FileText size={13} />
            <span>View Full Post-Mortem Report</span>
          </button>
        </div>
      )}

      {/* Main Workspace Split Grid */}
      {/* Main Workspace Split Grid */}
      <div className="main-split">
        {/* Left Column: Event Trace Timeline (Full Height) */}
        <div className="panel-column">
          <Timeline events={events} />
        </div>

        {/* Right Column: Spacious Tool Workspace with Tabs & Split Mode */}
        <div className="panel-column">
          {/* Tab Navigation Header Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-lg)",
              padding: "6px 10px"
            }}
          >
            {/* View Tabs */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                onClick={() => {
                  setViewMode("tabs");
                  setActiveTab("terminal");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.78rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  border: "none",
                  background: viewMode === "tabs" && activeTab === "terminal" ? "var(--bg-card-hover)" : "transparent",
                  color: viewMode === "tabs" && activeTab === "terminal" ? "var(--accent-cyan)" : "var(--text-secondary)",
                  borderBottom: viewMode === "tabs" && activeTab === "terminal" ? "2px solid var(--accent-cyan)" : "2px solid transparent"
                }}
              >
                <Terminal size={14} />
                <span>Sandbox Terminal</span>
                {terminalLogs.length > 0 && (
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "var(--accent-emerald)"
                    }}
                  />
                )}
              </button>

              <button
                onClick={() => {
                  setViewMode("tabs");
                  setActiveTab("diff");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.78rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  border: "none",
                  background: viewMode === "tabs" && activeTab === "diff" ? "var(--bg-card-hover)" : "transparent",
                  color: viewMode === "tabs" && activeTab === "diff" ? "var(--accent-amber)" : "var(--text-secondary)",
                  borderBottom: viewMode === "tabs" && activeTab === "diff" ? "2px solid var(--accent-amber)" : "2px solid transparent"
                }}
              >
                <GitCompare size={14} />
                <span>Patch Diff Viewer</span>
                {patches.length > 0 && (
                  <span
                    style={{
                      fontSize: "0.68rem",
                      padding: "1px 5px",
                      borderRadius: "var(--radius-sm)",
                      background: "rgba(245, 158, 11, 0.2)",
                      color: "#fbbf24",
                      fontWeight: "700"
                    }}
                  >
                    {patches.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setViewMode("tabs");
                  setActiveTab("insights");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.78rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  border: "none",
                  background: viewMode === "tabs" && activeTab === "insights" ? "var(--bg-card-hover)" : "transparent",
                  color: viewMode === "tabs" && activeTab === "insights" ? "var(--accent-purple)" : "var(--text-secondary)",
                  borderBottom: viewMode === "tabs" && activeTab === "insights" ? "2px solid var(--accent-purple)" : "2px solid transparent"
                }}
              >
                <Brain size={14} />
                <span>Insights &amp; Plan</span>
                {(hypotheses.length > 0 || reflections.length > 0) && (
                  <span
                    style={{
                      fontSize: "0.68rem",
                      padding: "1px 5px",
                      borderRadius: "var(--radius-sm)",
                      background: "rgba(139, 92, 246, 0.2)",
                      color: "#c084fc",
                      fontWeight: "700"
                    }}
                  >
                    {hypotheses.length + reflections.length}
                  </span>
                )}
              </button>
            </div>

            {/* Layout Mode Switcher */}
            <button
              onClick={() => setViewMode(viewMode === "tabs" ? "split" : "tabs")}
              className="btn-secondary"
              style={{
                height: "28px",
                padding: "0 8px",
                fontSize: "0.72rem",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
              title={viewMode === "tabs" ? "Switch to Stacked Split View" : "Switch to Spacious Full Tabs View"}
            >
              {viewMode === "tabs" ? <Columns size={12} /> : <LayoutGrid size={12} />}
              <span>{viewMode === "tabs" ? "Split View" : "Tabs View"}</span>
            </button>
          </div>

          {/* Active Workspace View */}
          {viewMode === "tabs" ? (
            <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
              {activeTab === "terminal" && <TerminalPanel logs={terminalLogs} />}
              {activeTab === "diff" && <DiffViewer patches={patches} />}
              {activeTab === "insights" && <InsightsPanel hypotheses={hypotheses} reflections={reflections} />}
            </div>
          ) : (
            /* Split View: Terminal & Diff Stood Side-by-Side or Stacked */
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", flex: 1 }}>
              <TerminalPanel logs={terminalLogs} />
              <DiffViewer patches={patches} />
              {(hypotheses.length > 0 || reflections.length > 0) && (
                <InsightsPanel hypotheses={hypotheses} reflections={reflections} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post-Mortem Modal */}
      {showReportModal && (
        <FinalReportModal report={finalReport} onClose={() => setShowReportModal(false)} />
      )}
    </div>
  );
}

function MainAuthRouter() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(ellipse at 50% 15%, #0f1d36 0%, #090c10 75%)",
          gap: "16px"
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #0284c7, #06b6d4)",
            width: "48px",
            height: "48px",
            borderRadius: "var(--radius-md)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 20px rgba(6, 182, 212, 0.5)"
          }}
        >
          <Cpu size={28} color="#ffffff" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-cyan)", fontSize: "14px", fontWeight: 600 }}>
          <span className="pulse-dot" style={{ background: "var(--accent-cyan)", color: "var(--accent-cyan)" }} />
          <span>Initializing AutoFixer AI...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <Dashboard />;
}

export function App() {
  return (
    <AuthProviderComponent>
      <MainAuthRouter />
    </AuthProviderComponent>
  );
}

export default App;

