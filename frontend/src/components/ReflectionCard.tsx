import React from "react";
import type { Reflection } from "../types";
import { ArrowRight, Compass } from "lucide-react";

interface ReflectionCardProps {
  reflections: Reflection[];
}

export const ReflectionCard: React.FC<ReflectionCardProps> = ({ reflections }) => {
  const latestReflection = reflections[reflections.length - 1];

  if (!latestReflection) return null;

  return (
    <div
      style={{
        background: "rgba(236, 72, 153, 0.05)",
        border: "1px solid rgba(236, 72, 153, 0.3)",
        borderLeft: "3px solid #ec4899",
        borderRadius: "var(--radius-md)",
        padding: "10px 14px",
        display: "flex",
        flexDirection: "column",
        gap: "6px"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", fontWeight: "700", color: "#f472b6" }}>
          <Compass size={14} color="#ec4899" />
          <span>Active Reflection & Recovery Loop</span>
        </div>
        <span
          style={{
            fontSize: "0.68rem",
            background: "rgba(236, 72, 153, 0.15)",
            color: "#f472b6",
            border: "1px solid rgba(236, 72, 153, 0.3)",
            padding: "1px 6px",
            borderRadius: "var(--radius-sm)",
            fontWeight: "600"
          }}
        >
          Cycle #{reflections.length}
        </span>
      </div>

      <div style={{ fontSize: "0.78rem", color: "var(--text-primary)" }}>
        <strong>Observation:</strong> {latestReflection.observation}
      </div>

      <div style={{ fontSize: "0.78rem", color: "#fb7185" }}>
        <strong>Why Previous Patch Incomplete:</strong> {latestReflection.why_it_failed}
      </div>

      <div style={{ fontSize: "0.78rem", color: "var(--accent-emerald)", display: "flex", alignItems: "flex-start", gap: "4px" }}>
        <ArrowRight size={14} style={{ marginTop: "2px", flexShrink: 0 }} />
        <span>
          <strong>Corrected Plan:</strong> {latestReflection.new_plan}
        </span>
      </div>

      {latestReflection.user_summary && (
        <div
          style={{
            fontSize: "0.72rem",
            color: "var(--text-secondary)",
            background: "var(--bg-tertiary)",
            padding: "4px 8px",
            borderRadius: "var(--radius-sm)",
            marginTop: "2px"
          }}
        >
          💡 <em>{latestReflection.user_summary}</em>
        </div>
      )}
    </div>
  );
};
