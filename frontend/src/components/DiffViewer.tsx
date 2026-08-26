import React, { useState } from "react";
import type { PatchInfo } from "../types";
import { GitCompare, FileCode } from "lucide-react";

interface DiffViewerProps {
  patches: PatchInfo[];
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ patches }) => {
  const [selectedPatchIndex, setSelectedPatchIndex] = useState(0);

  const activePatch = patches[selectedPatchIndex] || patches[patches.length - 1];

  const renderDiffLines = (diffStr: string) => {
    if (!diffStr) return <div>(No diff changes)</div>;
    const lines = diffStr.split("\n");

    return lines.map((line, idx) => {
      if (line.startsWith("+") && !line.startsWith("+++")) {
        return (
          <div key={idx} className="diff-line-add">
            {line}
          </div>
        );
      } else if (line.startsWith("-") && !line.startsWith("---")) {
        return (
          <div key={idx} className="diff-line-del">
            {line}
          </div>
        );
      } else if (line.startsWith("@@")) {
        return (
          <div key={idx} className="diff-line-header">
            {line}
          </div>
        );
      }
      return (
        <div key={idx} style={{ padding: "1px 4px", color: "var(--text-secondary)" }}>
          {line}
        </div>
      );
    });
  };

  return (
    <div className="card-container" style={{ flex: 1, minHeight: 0 }}>
      <div className="card-header">
        <span className="card-title">
          <GitCompare size={15} color="var(--accent-amber)" />
          Surgical Patch Diff Viewer
        </span>

        {/* Patch Selector Tabs */}
        {patches.length > 0 && (
          <div style={{ display: "flex", gap: "6px" }}>
            {patches.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedPatchIndex(idx)}
                style={{
                  background: selectedPatchIndex === idx ? "var(--accent-amber)" : "var(--bg-tertiary)",
                  color: selectedPatchIndex === idx ? "#000000" : "var(--text-secondary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-sm)",
                  padding: "2px 8px",
                  fontSize: "0.72rem",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Attempt #{p.attempt}
              </button>
            ))}
          </div>
        )}
      </div>

      {patches.length === 0 ? (
        <div style={{ padding: "30px 10px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.82rem" }}>
          No patch generated yet. The agent will formulate surgical diffs after analyzing test root causes.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1, minHeight: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.78rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <FileCode size={14} color="var(--accent-cyan)" />
              <code style={{ color: "#38bdf8", fontWeight: "600" }}>{activePatch?.target_file}</code>
            </div>
            <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>
              Attempt {activePatch?.attempt}
            </span>
          </div>

          {activePatch?.explanation && (
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontStyle: "italic" }}>
              "{activePatch.explanation}"
            </div>
          )}

          <div className="diff-container" style={{ flex: 1 }}>
            {renderDiffLines(activePatch?.diff_content || "")}
          </div>
        </div>
      )}
    </div>
  );
};
