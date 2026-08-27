import React from "react";
import type { FinalReport } from "../types";
import { CheckCircle2, AlertTriangle, Download, X } from "lucide-react";

interface FinalReportModalProps {
  report: FinalReport | null;
  onClose: () => void;
}

export const FinalReportModal: React.FC<FinalReportModalProps> = ({ report, onClose }) => {
  if (!report) return null;

  const isSuccess = report.status === "SUCCESS" || report.status === "COMPLETED";
  const isHuman = report.status === "HUMAN_INTERVENTION";

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const downloadMarkdown = () => {
    const blob = new Blob([report.markdown_report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `autofixer_report_${report.run_id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `autofixer_data_${report.run_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px"
      }}
    >
      <div
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-lg)",
          width: "100%",
          maxWidth: "800px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6)",
          overflow: "hidden"
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--bg-tertiary)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {isSuccess ? (
              <CheckCircle2 size={22} color="var(--accent-emerald)" />
            ) : isHuman ? (
              <AlertTriangle size={22} color="var(--accent-amber)" />
            ) : (
              <AlertTriangle size={22} color="var(--accent-rose)" />
            )}
            <div>
              <h2 style={{ fontSize: "1rem", fontWeight: "700" }}>
                AutoFixer AI Post-Mortem Report
              </h2>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                Run ID: {report.run_id}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: "4px"
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Status Banner */}
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "var(--radius-md)",
              background: isSuccess ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)",
              border: isSuccess ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(245, 158, 11, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <div>
              <div style={{ fontWeight: "700", color: isSuccess ? "var(--accent-emerald)" : "var(--accent-amber)" }}>
                {isSuccess ? "✅ ALL TESTS RESOLVED & PASSING" : "⚠️ HUMAN INTERVENTION REQUIRED"}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                Repository: <code>{report.repo_url}</code> | Branch: <code>{report.branch}</code>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>
              <span>⏱️ {report.execution_time_seconds}s</span>
              <span>🔄 {report.attempts_count} / {report.max_attempts} attempts</span>
            </div>
          </div>

          {/* Test Delta Table */}
          <div>
            <h3 style={{ fontSize: "0.85rem", fontWeight: "600", marginBottom: "8px", color: "var(--text-secondary)" }}>
              Test Suite Delta
            </h3>
            <div style={{ background: "var(--bg-primary)", borderRadius: "6px", padding: "10px", fontSize: "0.8rem" }}>
              <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center" }}>
                <div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>BASELINE</div>
                  <div style={{ fontWeight: "700", marginTop: "2px" }}>
                    {report.initial_test_results?.passed ?? 0} Passed / {report.initial_test_results?.failed ?? 0} Failed
                  </div>
                </div>
                <div style={{ fontSize: "1.2rem", color: "var(--accent-cyan)" }}>→</div>
                <div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>FINAL STATE</div>
                  <div style={{ fontWeight: "700", color: isSuccess ? "var(--accent-emerald)" : "var(--accent-rose)", marginTop: "2px" }}>
                    {report.final_test_results?.passed ?? 0} Passed / {report.final_test_results?.failed ?? 0} Failed
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Root Causes Summary */}
          {report.root_causes.length > 0 && (
            <div>
              <h3 style={{ fontSize: "0.85rem", fontWeight: "600", marginBottom: "8px", color: "var(--text-secondary)" }}>
                Identified Root Causes & Fixes
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {report.root_causes.map((rc, idx) => (
                  <div key={idx} style={{ background: "var(--bg-primary)", padding: "8px 12px", borderRadius: "6px", fontSize: "0.78rem" }}>
                    <div style={{ fontWeight: "600", color: "var(--accent-cyan)" }}>
                      #{idx + 1}: {rc.root_cause}
                    </div>
                    <div style={{ color: "var(--text-secondary)", marginTop: "2px" }}>
                      Proposed Fix: {rc.proposed_fix}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Patches Summary */}
          {report.patches.length > 0 && (
            <div>
              <h3 style={{ fontSize: "0.85rem", fontWeight: "600", marginBottom: "8px", color: "var(--text-secondary)" }}>
                Applied Surgical Patches ({report.patches.length})
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {report.patches.map((p, idx) => (
                  <div key={idx} style={{ background: "var(--bg-primary)", padding: "8px 12px", borderRadius: "6px", fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>
                    <div style={{ color: "var(--accent-amber)" }}>
                      Attempt #{p.attempt} on <code>{p.target_file}</code>
                    </div>
                    <div style={{ color: "var(--text-muted)", marginTop: "2px" }}>{p.explanation}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--bg-tertiary)"
          }}
        >
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn-secondary" onClick={downloadMarkdown}>
              <Download size={13} />
              <span>Download Report (.md)</span>
            </button>
            <button className="btn-secondary" onClick={downloadJSON}>
              <Download size={13} />
              <span>Download Data (.json)</span>
            </button>
          </div>

          <button className="btn-primary" onClick={onClose}>
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
