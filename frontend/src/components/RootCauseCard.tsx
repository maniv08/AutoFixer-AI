import React from "react";
import type { Hypothesis } from "../types";
import { Target } from "lucide-react";

interface RootCauseCardProps {
  hypotheses: Hypothesis[];
}

export const RootCauseCard: React.FC<RootCauseCardProps> = ({ hypotheses }) => {
  const latestHypothesis = hypotheses[hypotheses.length - 1];

  if (!latestHypothesis) return null;

  return (
    <div
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
          <span>Root Cause Analysis & Hypothesis</span>
        </div>
        <span
          style={{
            fontSize: "0.7rem",
            background: "rgba(139, 92, 246, 0.15)",
            color: "var(--accent-purple)",
            border: "1px solid rgba(139, 92, 246, 0.3)",
            padding: "1px 6px",
            borderRadius: "var(--radius-sm)",
            fontWeight: "600"
          }}
        >
          Confidence: {Math.round(latestHypothesis.confidence * 100)}%
        </span>
      </div>

      <div style={{ fontSize: "0.78rem", color: "var(--text-primary)" }}>
        <strong>Symptom:</strong> <span style={{ color: "var(--accent-rose)" }}>{latestHypothesis.symptom}</span>
      </div>

      <div style={{ fontSize: "0.78rem", color: "var(--text-primary)" }}>
        <strong>Root Cause:</strong> <span>{latestHypothesis.root_cause}</span>
      </div>

      {latestHypothesis.proposed_fix && (
        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
          <strong>Proposed Fix:</strong> {latestHypothesis.proposed_fix}
        </div>
      )}
    </div>
  );
};
