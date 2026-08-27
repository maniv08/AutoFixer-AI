import React, { useRef, useEffect, useState } from "react";
import { Terminal, Copy, Check, ArrowDownCircle, Shield, Zap, TerminalSquare } from "lucide-react";

interface TerminalPanelProps {
  logs: string[];
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({ logs }) => {
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const terminalWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && terminalWrapperRef.current && logs.length > 0) {
      terminalWrapperRef.current.scrollTop = terminalWrapperRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleCopy = () => {
    navigator.clipboard.writeText(logs.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isStreaming = logs.length > 0;

  return (
    <div className="card-container" style={{ flex: 1, minHeight: 0 }}>
      {/* Panel Header */}
      <div className="card-header">
        <span className="card-title">
          <Terminal size={15} color="var(--accent-emerald)" />
          Sandbox Execution Terminal
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className="btn-secondary"
            style={{
              height: "30px",
              padding: "0 10px",
              fontSize: "0.75rem",
              background: autoScroll ? "rgba(16, 185, 129, 0.15)" : "var(--bg-tertiary)",
              color: autoScroll ? "var(--accent-emerald)" : "var(--text-secondary)",
              borderColor: autoScroll ? "var(--accent-emerald)" : "var(--border-color)"
            }}
          >
            <ArrowDownCircle size={13} />
            <span>Auto-scroll</span>
          </button>
          <button
            onClick={handleCopy}
            className="btn-secondary"
            style={{ height: "30px", padding: "0 10px", fontSize: "0.75rem" }}
            title="Copy Terminal Logs"
          >
            {copied ? <Check size={13} color="var(--accent-emerald)" /> : <Copy size={13} />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>

      {/* Terminal Window Box */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          background: "var(--terminal-bg)",
          border: "1px solid var(--terminal-border)",
          borderRadius: "var(--radius-md)",
          flex: 1,
          minHeight: 0,
          overflow: "hidden"
        }}
      >
        {/* Terminal Chrome Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "6px 12px",
            background: "#080c14",
            borderBottom: "1px solid #1a2234",
            fontSize: "0.72rem",
            fontFamily: "var(--font-mono)",
            color: "var(--text-muted)",
            userSelect: "none"
          }}
        >
          {/* macOS / Linux Window Dots */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f43f5e", display: "inline-block", opacity: 0.8 }} />
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f59e0b", display: "inline-block", opacity: 0.8 }} />
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981", display: "inline-block", opacity: 0.8 }} />
            <span style={{ marginLeft: "8px", color: "var(--text-secondary)", fontWeight: "500" }}>
              sandbox@autofixer:~/repo
            </span>
          </div>

          {/* Live Status Badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: isStreaming ? "var(--accent-emerald)" : "var(--text-muted)"
              }}
            />
            <span style={{ color: isStreaming ? "var(--accent-emerald)" : "var(--text-muted)", fontWeight: "600", fontSize: "0.68rem" }}>
              {isStreaming ? "STREAMING (LIVE)" : "STANDBY (READY)"}
            </span>
          </div>
        </div>

        {/* Terminal Content Stream */}
        <div ref={terminalWrapperRef} className="terminal-wrapper" style={{ border: "none", borderRadius: 0 }}>
          {logs.length === 0 ? (
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                padding: "24px 16px",
                gap: "16px",
                color: "var(--text-secondary)"
              }}
            >
              {/* Terminal Icon & Title */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                <div
                  style={{
                    background: "rgba(6, 182, 212, 0.1)",
                    border: "1px solid rgba(6, 182, 212, 0.3)",
                    padding: "10px",
                    borderRadius: "var(--radius-md)"
                  }}
                >
                  <TerminalSquare size={26} color="var(--accent-cyan)" />
                </div>
                <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "#f1f5f9", letterSpacing: "-0.01em" }}>
                  Secure Subprocess Execution Sandbox
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", maxWidth: "380px", textAlign: "center", lineHeight: "1.4" }}>
                  Isolated runtime environment with automated secret stripping, path jailing, and real-time event telemetry.
                </div>
              </div>

              {/* Security & Sandbox Feature Tags */}
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px", maxWidth: "460px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-color)",
                    padding: "4px 8px",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.7rem",
                    color: "var(--text-secondary)"
                  }}
                >
                  <Shield size={12} color="var(--accent-emerald)" />
                  <span>API Keys &amp; Secrets Redacted</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-color)",
                    padding: "4px 8px",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.7rem",
                    color: "var(--text-secondary)"
                  }}
                >
                  <Zap size={12} color="var(--accent-amber)" />
                  <span>45s Hard Timeout Guard</span>
                </div>
              </div>

              {/* Interactive Ready Prompt with Blinking Cursor */}
              <div
                style={{
                  marginTop: "8px",
                  background: "#080c14",
                  border: "1px solid #1a2234",
                  padding: "6px 14px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.76rem",
                  fontFamily: "var(--font-mono)",
                  color: "var(--accent-cyan)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <span>autofixer@sandbox:~$ ready — click <strong>Start Agent</strong> or <strong>Demo Repo</strong> to begin</span>
                <span
                  style={{
                    display: "inline-block",
                    width: "8px",
                    height: "14px",
                    background: "var(--accent-cyan)",
                    borderRadius: "1px",
                    animation: "pulseGlow 1s infinite"
                  }}
                />
              </div>
            </div>
          ) : (
            logs.map((chunk, idx) => {
              const isCommand = chunk.startsWith("$ ");
              const isPass = chunk.includes("passed") || chunk.includes("PASSED") || chunk.includes("OK");
              const isFail = chunk.includes("failed") || chunk.includes("FAILED") || chunk.includes("ERROR");

              let color = "#cbd5e1";
              if (isCommand) color = "var(--accent-cyan)";
              else if (isFail) color = "#fb7185";
              else if (isPass) color = "#34d399";

              return (
                <div
                  key={idx}
                  style={{
                    color,
                    fontWeight: isCommand ? "600" : "400",
                    marginBottom: isCommand ? "6px" : "2px",
                    borderLeft: isCommand ? "2px solid var(--accent-cyan)" : "none",
                    paddingLeft: isCommand ? "8px" : "0",
                    lineHeight: "1.45"
                  }}
                >
                  {chunk}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
