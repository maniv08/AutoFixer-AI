import React from "react";
import type { Hypothesis, Reflection } from "../types";
import { Target, Compass, ArrowRight, Brain, Lightbulb, ShieldAlert } from "lucide-react";

interface InsightsPanelProps {
  hypotheses: Hypothesis[];
  reflections: Reflection[];
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ hypotheses, reflections }) => {
  const isIdle = hypotheses.length === 0 && reflections.length === 0;

  if (isIdle) {
    return (
      <div className="card-container" style={{ flex: 1, minHeight: 0, justifyContent: "center", alignItems: "center", padding: "30px 20px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", maxWidth: "460px", gap: "16px" }}>
          <div
            style={{
              background: "rgba(139, 92, 246, 0.12)",
              border: "1px solid rgba(139, 92, 246, 0.3)",
              padding: "12px",
              borderRadius: "var(--radius-md)"
            }}
          >
            <Brain size={28} color="var(--accent-purple)" />
          </div>

          <div>
            <h3 style={{ fontSize: "0.95rem", fontWeight: "700", color: "#f1f5f9" }}>
              Autonomous Reasoning &amp; Self-Reflection Loop
            </h3>
            <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "4px", lineHeight: "1.4" }}>
              AutoFixer AI dynamically inspects test failure stack traces, forms confidence-scored hypotheses, and self-reflects when a patch only partially passes.
            </p>
          </div>

          {/* Workflow Steps Preview */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", width: "100%", textAlign: "left" }}>
            <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", padding: "8px 10px", borderRadius: "var(--radius-sm)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.72rem", fontWeight: "600", color: "var(--accent-cyan)" }}>
                <Target size={13} />
                <span>1. Root Cause Analysis</span>
              </div>
              <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "2px" }}>
                Identifies bug mechanisms and assigns confidence scores.
              </p>
            </div>

            <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", padding: "8px 10px", borderRadius: "var(--radius-sm)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.72rem", fontWeight: "600", color: "#f472b6" }}>
                <Compass size={13} />
                <span>2. Structured Reflection</span>
              </div>
              <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "2px" }}>
                Diagnoses why partial patches failed and pivots plan.
              </p>
            </div>
          </div>

          <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", fontStyle: "italic" }}>
            👉 Click <strong>1-Click Demo Repo</strong> and <strong>Start Agent</strong> to watch live reasoning.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-container" style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: "14px" }}>
      <div className="card-header" style={{ marginBottom: "2px" }}>
        <span className="card-title">
          <Brain size={15} color="var(--accent-purple)" />
          Agent Reasoning, Hypotheses &amp; Reflection Cycles
        </span>
        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          {hypotheses.length} Hypotheses · {reflections.length} Reflections
        </span>
      </div>

      {/* List of Hypotheses */}
      {hypotheses.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: "600", letterSpacing: "0.05em" }}>
            Root Cause Hypotheses ({hypotheses.length})
          </div>

          {hypotheses.map((hyp, idx) => (
            <div
              key={idx}
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                borderLeft: "3px solid var(--accent-purple)",
                borderRadius: "var(--radius-md)",
                padding: "10px 14px",
                display: "flex",
                flexDirection: "column",
                gap: "6px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", fontWeight: "700", color: "#c084fc" }}>
                  <Target size={14} color="var(--accent-purple)" />
                  <span>Hypothesis #{idx + 1}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      background: "rgba(139, 92, 246, 0.15)",
                      color: "var(--accent-purple)",
                      border: "1px solid rgba(139, 92, 246, 0.3)",
                      padding: "2px 8px",
                      borderRadius: "var(--radius-sm)",
                      fontWeight: "600"
                    }}
                  >
                    Precision Confidence: {(hyp.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div style={{ fontSize: "0.78rem", color: "var(--text-primary)" }}>
                <strong style={{ color: "var(--text-secondary)" }}>Symptom:</strong>{" "}
                <span style={{ color: "var(--accent-rose)", fontWeight: "500" }}>{hyp.symptom}</span>
              </div>

              <div style={{ fontSize: "0.78rem", color: "var(--text-primary)" }}>
                <strong style={{ color: "var(--text-secondary)" }}>Root Cause:</strong> <span>{hyp.root_cause}</span>
              </div>

              {hyp.proposed_fix && (
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                  <strong>Proposed Surgical Fix:</strong> {hyp.proposed_fix}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* List of Reflection Cycles */}
      {reflections.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
          <div style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "#f472b6", fontWeight: "600", letterSpacing: "0.05em" }}>
            Active Reflection Cycles ({reflections.length})
          </div>

          {reflections.map((ref, idx) => (
            <div
              key={idx}
              style={{
                background: "rgba(236, 72, 153, 0.05)",
                border: "1px solid rgba(236, 72, 153, 0.3)",
                borderLeft: "3px solid #ec4899",
                borderRadius: "var(--radius-md)",
                padding: "12px 14px",
                display: "flex",
                flexDirection: "column",
                gap: "8px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", fontWeight: "700", color: "#f472b6" }}>
                  <Compass size={14} color="#ec4899" />
                  <span>Reflection &amp; Strategy Pivot (Cycle #{idx + 1})</span>
                </div>
                <span
                  style={{
                    fontSize: "0.68rem",
                    background: "rgba(236, 72, 153, 0.15)",
                    color: "#f472b6",
                    border: "1px solid rgba(236, 72, 153, 0.3)",
                    padding: "2px 6px",
                    borderRadius: "var(--radius-sm)",
                    fontWeight: "600"
                  }}
                >
                  Post-Attempt Reflection
                </span>
              </div>

              <div style={{ fontSize: "0.78rem", color: "var(--text-primary)" }}>
                <strong style={{ color: "var(--text-secondary)" }}>Observation:</strong> {ref.observation}
              </div>

              <div style={{ fontSize: "0.78rem", color: "#fb7185", background: "rgba(244, 63, 94, 0.1)", padding: "6px 10px", borderRadius: "var(--radius-sm)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "2px", fontWeight: "600" }}>
                  <ShieldAlert size={12} />
                  <span>Why Previous Patch Was Incomplete:</span>
                </div>
                <div>{ref.why_it_failed}</div>
              </div>

              <div style={{ fontSize: "0.78rem", color: "var(--accent-emerald)", display: "flex", alignItems: "flex-start", gap: "6px", background: "rgba(16, 185, 129, 0.1)", padding: "6px 10px", borderRadius: "var(--radius-sm)" }}>
                <ArrowRight size={14} style={{ marginTop: "2px", flexShrink: 0 }} />
                <div>
                  <strong style={{ display: "block", marginBottom: "1px" }}>Corrected Plan for Next Attempt:</strong>
                  <span>{ref.new_plan}</span>
                </div>
              </div>

              {ref.user_summary && (
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--text-secondary)",
                    background: "var(--bg-tertiary)",
                    padding: "4px 8px",
                    borderRadius: "var(--radius-sm)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <Lightbulb size={12} color="#fbbf24" />
                  <span>{ref.user_summary}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
