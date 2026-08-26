import React from "react";
import type { AgentState, TestSummary } from "../types";
import { Activity, CheckCircle2, XCircle, Layers, ArrowRight, Clock } from "lucide-react";

interface StateBannerProps {
  state: AgentState;
  attempt: number;
  maxAttempts: number;
  testSummary: TestSummary | null;
}

export const StateBanner: React.FC<StateBannerProps> = ({
  state,
  attempt,
  maxAttempts,
  testSummary
}) => {
  const getStateClass = (st: AgentState) => {
    switch (st) {
      case "PLANNING":
      case "CLONING":
        return "badge-planning";
      case "ANALYZING":
      case "OBSERVING":
      case "ANALYZING_FAILURE":
        return "badge-analyzing";
      case "RUNNING":
      case "RUNNING_TESTS":
        return "badge-running";
      case "ROOT_CAUSE_FOUND":
      case "FIXING":
        return "badge-fixing";
      case "REFLECTING":
      case "CORRECTING":
        return "badge-reflecting";
      case "RETESTING":
        return "badge-retesting";
      case "COMPLETED":
      case "SUCCESS":
        return "badge-success";
      case "FAILED":
        return "badge-failed";
      case "HUMAN_INTERVENTION":
        return "badge-human";
      default:
        return "badge-idle";
    }
  };

  const isIdle = state === "IDLE";
  const hasTests = testSummary !== null && testSummary.initial !== null;
  const initialPassed = testSummary?.initial?.passed ?? 0;
  const initialFailed = testSummary?.initial?.failed ?? 0;
  const currentPassed = testSummary?.current?.passed ?? initialPassed;
  const currentFailed = testSummary?.current?.failed ?? initialFailed;

  return (
    <div className="metrics-bar">
      {/* Agent Live State */}
      <div className="metric-card">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Activity size={18} color="var(--accent-cyan)" />
          </div>
          <div>
            <div style={{ fontSize: "0.68rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: "600" }}>
              Agent Status
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
              <span className="pulse-dot" style={{ background: "currentColor" }}></span>
              <span
                style={{
                  fontSize: "0.82rem",
                  fontWeight: "700",
                  letterSpacing: "0.03em",
                  padding: "2px 8px"
                }}
                className={getStateClass(state)}
              >
                {state.replace(/_/g, " ")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Iteration Loop Counter */}
      <div className="metric-card">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Layers size={18} color="var(--accent-purple)" />
          <div>
            <div style={{ fontSize: "0.68rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: "600" }}>
              Iteration Loop
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: "700", fontFamily: "var(--font-mono)", marginTop: "2px" }}>
              {isIdle ? (
                <>
                  Attempt <span style={{ color: "var(--text-muted)" }}>—</span>{" "}
                  <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>/ {maxAttempts}</span>
                </>
              ) : (
                <>
                  Attempt {attempt}{" "}
                  <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>/ {maxAttempts}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ width: "90px", height: "10px", background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", overflow: "hidden", padding: "1px" }}>
          <div
            style={{
              width: isIdle ? "0%" : `${(attempt / maxAttempts) * 100}%`,
              height: "100%",
              background: "linear-gradient(90deg, #8b5cf6, #a78bfa)",
              borderRadius: "var(--radius-sm)",
              transition: "width 0.3s ease"
            }}
          />
        </div>
      </div>

      {/* Test Suite Breakdown */}
      <div className="metric-card" style={{ flex: 1.5, padding: "8px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <div style={{ fontSize: "0.68rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: "600" }}>
              Test Delta
            </div>

            {hasTests ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px", fontSize: "0.82rem", fontFamily: "var(--font-mono)" }}>
                {/* Baseline pill */}
                <div style={{ background: "var(--bg-primary)", border: "1px solid var(--border-color)", padding: "3px 8px", borderRadius: "var(--radius-sm)" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.7rem", marginRight: "4px" }}>Base:</span>
                  <span style={{ color: initialFailed > 0 ? "var(--accent-rose)" : "var(--accent-emerald)", fontWeight: "600" }}>
                    {initialPassed}P / {initialFailed}F
                  </span>
                </div>

                <ArrowRight size={13} color="var(--text-muted)" />

                {/* Current pill */}
                <div style={{ background: "var(--bg-primary)", border: "1px solid var(--border-color)", padding: "3px 8px", borderRadius: "var(--radius-sm)" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.7rem", marginRight: "4px" }}>Now:</span>
                  <span style={{ color: currentFailed === 0 && currentPassed > 0 ? "var(--accent-emerald)" : (currentFailed > 0 ? "var(--accent-amber)" : "var(--text-secondary)"), fontWeight: "700" }}>
                    {currentPassed}P / {currentFailed}F
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontStyle: "italic", marginTop: "2px" }}>
                {isIdle ? "Awaiting first test run" : "Running baseline tests..."}
              </div>
            )}
          </div>

          {/* Status Indicator */}
          {(() => {
            if (hasTests && currentFailed === 0 && currentPassed > 0) {
              return (
                <div
                  style={{
                    padding: "6px 12px",
                    borderRadius: "var(--radius-md)",
                    background: "rgba(16, 185, 129, 0.15)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    color: "var(--accent-emerald)",
                    fontSize: "0.78rem",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    flexShrink: 0
                  }}
                >
                  <CheckCircle2 size={15} />
                  <span>VERIFIED ✅ (100% Passing)</span>
                </div>
              );
            }
            if (hasTests && currentFailed > 0) {
              return (
                <div
                  style={{
                    padding: "6px 12px",
                    borderRadius: "var(--radius-md)",
                    background: "rgba(244, 63, 94, 0.15)",
                    border: "1px solid rgba(244, 63, 94, 0.3)",
                    color: "var(--accent-rose)",
                    fontSize: "0.78rem",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    flexShrink: 0
                  }}
                >
                  <XCircle size={15} />
                  <span>{currentFailed} Failing</span>
                </div>
              );
            }
            return (
              <div
                style={{
                  padding: "6px 12px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--bg-tertiary)",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-muted)",
                  fontSize: "0.78rem",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  flexShrink: 0
                }}
              >
                <Clock size={13} />
                <span>{isIdle ? "Awaiting Run" : "Running..."}</span>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
