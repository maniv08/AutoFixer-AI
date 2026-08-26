import React, { useState } from "react";
import { Play, Sparkles, Cpu, Settings, Globe, Check, FolderGit2 } from "lucide-react";
import { getServerUrl, setServerUrl } from "../config";

interface HeaderProps {
  mode: "demo" | "custom";
  setMode: (mode: "demo" | "custom") => void;
  repoUrl: string;
  setRepoUrl: (url: string) => void;
  testCommand: string;
  setTestCommand: (cmd: string) => void;
  maxAttempts: number;
  setMaxAttempts: (n: number) => void;
  onStartRun: () => void;
  isLoading: boolean;
  isConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  setMode,
  repoUrl,
  setRepoUrl,
  testCommand,
  setTestCommand,
  maxAttempts,
  setMaxAttempts,
  onStartRun,
  isLoading,
  isConnected
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState(getServerUrl());
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveServer = () => {
    setServerUrl(serverUrlInput);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setShowSettings(false);
    }, 1200);
  };

  return (
    <header className="header-panel">
      {/* Brand & Subtitle Group */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
        <div
          style={{
            background: "linear-gradient(135deg, #0284c7, #06b6d4)",
            width: "38px",
            height: "38px",
            borderRadius: "var(--radius-md)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 12px rgba(6, 182, 212, 0.4)",
            flexShrink: 0
          }}
        >
          <Cpu size={22} color="#ffffff" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h1 style={{ fontSize: "1.15rem", fontWeight: "700", letterSpacing: "-0.02em", lineHeight: "1.2" }}>
            AutoFixer <span style={{ color: "var(--accent-cyan)" }}>AI</span>
          </h1>
          <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: "1.2", marginTop: "2px" }}>
            Give it a broken repository. It finds, fixes, tests, and verifies the solution.
          </p>
        </div>
      </div>

      {/* Target Selector & Execution Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flex: 1,
          justifyContent: "flex-end",
          flexWrap: "nowrap",
          minWidth: 0
        }}
      >
        {/* Mode Selector Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            padding: "2px",
            height: "34px",
            flexShrink: 0
          }}
        >
          <button
            onClick={() => setMode("demo")}
            disabled={isLoading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "0 12px",
              height: "28px",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.78rem",
              fontWeight: "600",
              cursor: "pointer",
              border: "none",
              background: mode === "demo" ? "rgba(245, 158, 11, 0.15)" : "transparent",
              color: mode === "demo" ? "#fbbf24" : "var(--text-secondary)",
              transition: "all 0.15s"
            }}
          >
            <Sparkles size={13} color={mode === "demo" ? "#f59e0b" : "currentColor"} />
            <span>Demo Repo</span>
          </button>

          <button
            onClick={() => setMode("custom")}
            disabled={isLoading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "0 12px",
              height: "28px",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.78rem",
              fontWeight: "600",
              cursor: "pointer",
              border: "none",
              background: mode === "custom" ? "rgba(6, 182, 212, 0.15)" : "transparent",
              color: mode === "custom" ? "var(--accent-cyan)" : "var(--text-secondary)",
              transition: "all 0.15s"
            }}
          >
            <FolderGit2 size={13} color={mode === "custom" ? "var(--accent-cyan)" : "currentColor"} />
            <span>Custom Repo</span>
          </button>
        </div>

        {/* Custom Repo Mode Inputs */}
        {mode === "custom" && (
          <>
            {/* Custom GitHub Repo URL Input (Required) */}
            <input
              type="text"
              className="input-field"
              style={{ flex: "1 1 240px", minWidth: "190px", maxWidth: "340px" }}
              placeholder="https://github.com/username/project"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              disabled={isLoading}
              title="GitHub Repository URL (Required)"
            />

            {/* Custom Test Command Input (Optional) */}
            <input
              type="text"
              className="input-field"
              style={{ width: "190px", flexShrink: 0 }}
              placeholder="Auto-detect (e.g. pytest)"
              value={testCommand}
              onChange={(e) => setTestCommand(e.target.value)}
              disabled={isLoading}
              title="Test Command (Optional) - Leave blank for automatic test framework detection"
            />
          </>
        )}

        {/* Retries Selector */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            padding: "0 8px",
            height: "34px",
            flexShrink: 0
          }}
        >
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "500" }}>Retries:</span>
          <select
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-primary)",
              fontSize: "0.8rem",
              fontFamily: "var(--font-mono)",
              outline: "none",
              cursor: "pointer"
            }}
            value={maxAttempts}
            onChange={(e) => setMaxAttempts(Number(e.target.value))}
            disabled={isLoading}
          >
            {[1, 2, 3, 4, 5, 7, 10].map((num) => (
              <option key={num} value={num} style={{ background: "var(--bg-card)" }}>
                {num}
              </option>
            ))}
          </select>
        </div>

        {/* Single Primary Call-to-Action: Start Agent Button */}
        <button
          className="btn-primary"
          onClick={onStartRun}
          disabled={isLoading}
          style={{ minWidth: "125px", justifyContent: "center", flexShrink: 0 }}
        >
          {isLoading ? (
            <>
              <span className="pulse-dot" style={{ color: "#ffffff", background: "#ffffff" }}></span>
              <span>Refactoring...</span>
            </>
          ) : (
            <>
              <Play size={13} fill="#ffffff" />
              <span>Start Agent</span>
            </>
          )}
        </button>

        {/* Server Config Settings Button */}
        <button
          className="btn-secondary"
          onClick={() => setShowSettings(!showSettings)}
          title={`Backend Server URL: ${getServerUrl()} (${isConnected ? "Connected" : "Disconnected"})`}
          style={{ padding: "0 10px", flexShrink: 0 }}
        >
          <span
            className="pulse-dot"
            style={{
              background: isConnected ? "var(--accent-emerald)" : "var(--accent-rose)",
              color: isConnected ? "var(--accent-emerald)" : "var(--accent-rose)"
            }}
          />
          <Settings size={14} />
        </button>
      </div>

      {/* Settings Modal Dropdown */}
      {showSettings && (
        <div
          style={{
            position: "absolute",
            top: "65px",
            right: "20px",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-lg)",
            padding: "16px",
            zIndex: 1000,
            boxShadow: "0 10px 25px rgba(0,0,0,0.7)",
            width: "320px",
            display: "flex",
            flexDirection: "column",
            gap: "10px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", fontWeight: "600", color: "var(--accent-cyan)" }}>
            <Globe size={15} />
            <span>Backend Server Host / Port</span>
          </div>
          <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
            Change backend server URL or port (e.g. <code>http://localhost:8000</code>).
          </p>
          <input
            type="text"
            className="input-field"
            style={{ width: "100%" }}
            value={serverUrlInput}
            onChange={(e) => setServerUrlInput(e.target.value)}
            placeholder="http://localhost:8000"
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
            <button
              className="btn-secondary"
              onClick={() => {
                setServerUrlInput("http://localhost:8000");
                setServerUrl("http://localhost:8000");
              }}
              style={{ fontSize: "0.72rem", height: "28px" }}
            >
              Reset Default
            </button>
            <button
              className="btn-primary"
              onClick={handleSaveServer}
              style={{ fontSize: "0.72rem", height: "28px", padding: "0 12px" }}
            >
              {savedSuccess ? <Check size={12} /> : null}
              <span>{savedSuccess ? "Saved!" : "Save Server"}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
