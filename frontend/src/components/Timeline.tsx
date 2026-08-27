import React, { useRef, useEffect } from "react";
import type { AgentEvent } from "../types";
import { Clock, Wrench, FileCode, RefreshCw, GitBranch, Search } from "lucide-react";

interface TimelineProps {
  events: AgentEvent[];
}

export const Timeline: React.FC<TimelineProps> = ({ events }) => {
  const listContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listContainerRef.current && events.length > 0) {
      listContainerRef.current.scrollTop = listContainerRef.current.scrollHeight;
    }
  }, [events]);

  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case "clone_repository":
      case "git_diff":
      case "git_status":
        return <GitBranch size={13} color="var(--accent-cyan)" />;
      case "read_file":
      case "write_file":
        return <FileCode size={13} color="var(--accent-purple)" />;
      case "search_code":
      case "inspect_project":
        return <Search size={13} color="var(--accent-blue)" />;
      case "apply_patch":
        return <Wrench size={13} color="var(--accent-amber)" />;
      case "run_tests":
      case "run_specific_test":
        return <RefreshCw size={13} color="var(--accent-emerald)" />;
      default:
        return <Wrench size={13} color="var(--text-muted)" />;
    }
  };

  return (
    <div className="card-container" style={{ flex: 1, minHeight: 0 }}>
      <div className="card-header">
        <span className="card-title">
          <Clock size={15} color="var(--accent-cyan)" />
          Chronological Event Trace
        </span>
        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          {events.length} Events Logged
        </span>
      </div>

      <div ref={listContainerRef} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", paddingRight: "4px" }}>
        {events.length === 0 ? (
          <div style={{ padding: "30px 10px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.82rem" }}>
            Ready to initialize agent. Click <strong>Start Agent</strong> or <strong>1-Click Demo Repo</strong> above.
          </div>
        ) : (
          events.map((evt, idx) => {
            const timeStr = new Date(evt.timestamp).toLocaleTimeString();

            if (evt.event_type === "state_change") {
              return (
                <div
                  key={evt.event_id || idx}
                  style={{
                    background: "rgba(15, 23, 42, 0.6)",
                    borderLeft: "3px solid var(--accent-cyan)",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.8rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>
                      {evt.data?.message || `State transition to ${evt.state}`}
                    </span>
                  </div>
                  <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                    {timeStr}
                  </span>
                </div>
              );
            }

            if (evt.event_type === "tool_end") {
              const tool = evt.data?.tool || "tool";
              const result = evt.data?.result || {};
              const isSuccess = result.success !== false;

              return (
                <div
                  key={evt.event_id || idx}
                  style={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-color)",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.78rem"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {getToolIcon(tool)}
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: "600", color: "var(--accent-cyan)" }}>
                        {tool}
                      </span>
                      {result.target && (
                        <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>
                          → <code style={{ color: "#e2e8f0" }}>{result.target}</code>
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                      {timeStr}
                    </span>
                  </div>

                  {result.reason && (
                    <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                      <strong>Reason:</strong> {result.reason}
                    </div>
                  )}

                  {result.message && (
                    <div style={{ fontSize: "0.72rem", color: isSuccess ? "var(--accent-emerald)" : "var(--accent-rose)" }}>
                      {result.message}
                    </div>
                  )}
                </div>
              );
            }

            return null;
          })
        )}
      </div>
    </div>
  );
};
