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

  const {
    isConnected,
    state,
    attempt,
    events,
    terminalLogs,
    testSummary,
    hypotheses,
    reflections,
    patches,
    finalReport
  } = useAgentWebSocket(activeRunId);

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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setActiveRunId(data.run_id);
    } catch (err) {
      console.error("Failed to start run:", err);
      alert(`Failed to start run. Please ensure backend server is reachable at ${getServerUrl()}`);
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
        isConnected={isConnected}
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

