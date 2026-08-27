import React, { useState, useEffect, useRef } from "react";
import { Play, Sparkles, Settings, Globe, Check, FolderGit2, LogOut, RotateCw } from "lucide-react";
import { getServerUrl, setServerUrl, DEFAULT_PRODUCTION_BACKEND_URL } from "../config";
import { useAuth } from "../context/AuthContext";

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
  const { user, userRepos, isLoadingRepos, fetchUserGithubRepos, signOut } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState(getServerUrl());
  const [savedSuccess, setSavedSuccess] = useState(false);

  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const settingsDropdownRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      // Close Settings if open and clicked/touched outside
      if (
        showSettings &&
        settingsDropdownRef.current &&
        !settingsDropdownRef.current.contains(target) &&
        settingsButtonRef.current &&
        !settingsButtonRef.current.contains(target)
      ) {
        setShowSettings(false);
      }

      // Close Profile Menu if open and clicked/touched outside
      if (
        showProfileMenu &&
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(target) &&
        profileButtonRef.current &&
        !profileButtonRef.current.contains(target)
      ) {
        setShowProfileMenu(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowSettings(false);
        setShowProfileMenu(false);
      }
    };

    if (showSettings || showProfileMenu) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showSettings, showProfileMenu]);

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
      <div className="header-brand">
        <img
          src="/logo.png"
          alt="AutoFixer AI Logo"
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "var(--radius-md)",
            objectFit: "cover",
            boxShadow: "0 0 12px rgba(6, 182, 212, 0.4)",
            flexShrink: 0,
            border: "1px solid rgba(56, 189, 248, 0.3)"
          }}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h1 style={{ fontSize: "1.1rem", fontWeight: "700", letterSpacing: "-0.02em", lineHeight: "1.2", whiteSpace: "nowrap" }}>
            AutoFixer <span style={{ color: "var(--accent-cyan)" }}>AI</span>
          </h1>
          <p className="header-subtitle" style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: "1.2", marginTop: "2px", whiteSpace: "nowrap" }}>
            Autonomous Software QA & Refactoring Agent
          </p>
        </div>
      </div>

      {/* Target Selector & Execution Controls */}
      <div className="header-controls">
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
              padding: "0 10px",
              height: "28px",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.76rem",
              fontWeight: "600",
              cursor: "pointer",
              border: "none",
              background: mode === "demo" ? "rgba(245, 158, 11, 0.18)" : "transparent",
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
              padding: "0 10px",
              height: "28px",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.76rem",
              fontWeight: "600",
              cursor: "pointer",
              border: "none",
              background: mode === "custom" ? "rgba(6, 182, 212, 0.18)" : "transparent",
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
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "nowrap" }}>
            {/* GitHub Account Repos Quick Selector */}
            {user?.provider === "github" && (
              <div style={{ display: "flex", alignItems: "center", gap: "3px", flexShrink: 0 }}>
                <select
                  className="input-field"
                  style={{
                    width: "165px",
                    height: "34px",
                    background: "var(--bg-tertiary)",
                    color: repoUrl && userRepos.some(r => r.html_url === repoUrl) ? "var(--accent-cyan)" : "var(--text-secondary)",
                    cursor: "pointer",
                    padding: "0 6px",
                    fontSize: "0.76rem",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}
                  value={userRepos.find(r => r.html_url === repoUrl)?.html_url || ""}
                  onChange={(e) => {
                    if (e.target.value) {
                      setRepoUrl(e.target.value);
                    }
                  }}
                  disabled={isLoading || isLoadingRepos}
                  title="Select a repository directly from your GitHub account"
                >
                  <option value="">
                    {isLoadingRepos ? "Loading repos..." : `🐙 Repos (${userRepos.length})`}
                  </option>
                  {userRepos.map((r) => (
                    <option key={r.id} value={r.html_url} style={{ background: "var(--bg-card)", color: "#ffffff" }}>
                      {r.name} {r.private ? "🔒" : ""}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={fetchUserGithubRepos}
                  disabled={isLoadingRepos}
                  title="Refresh GitHub Repositories"
                  style={{
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-md)",
                    height: "34px",
                    width: "30px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "var(--text-secondary)",
                    flexShrink: 0
                  }}
                >
                  <RotateCw size={12} className={isLoadingRepos ? "pulse-dot" : ""} />
                </button>
              </div>
            )}

            {/* Custom GitHub Repo URL Input (Required) */}
            <input
              type="text"
              className="input-field"
              style={{
                width: "210px",
                height: "34px",
                padding: "0 10px",
                fontSize: "0.78rem"
              }}
              placeholder="https://github.com/..."
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              disabled={isLoading}
              title="GitHub Repository URL (Required)"
            />

            {/* Custom Test Command Input (Optional) */}
            <input
              type="text"
              className="input-field"
              style={{
                width: "130px",
                height: "34px",
                padding: "0 8px",
                fontSize: "0.78rem",
                flexShrink: 0
              }}
              placeholder="Command (opt)"
              value={testCommand}
              onChange={(e) => setTestCommand(e.target.value)}
              disabled={isLoading}
              title="Test Command (Optional) - Leave blank for auto-detection (pytest/npm/mvn)"
            />
          </div>
        )}

        {/* Retries Selector */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            padding: "0 8px",
            height: "34px",
            flexShrink: 0
          }}
        >
          <span style={{ fontSize: "0.74rem", color: "var(--text-secondary)", fontWeight: "500" }}>Retries:</span>
          <select
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-primary)",
              fontSize: "0.78rem",
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

        {/* Primary Call-to-Action: Start Agent Button */}
        <button
          className="btn-primary"
          onClick={onStartRun}
          disabled={isLoading}
          style={{ height: "34px", minWidth: "115px", padding: "0 12px", justifyContent: "center", flexShrink: 0 }}
        >
          {isLoading ? (
            <>
              <span className="pulse-dot" style={{ color: "#ffffff", background: "#ffffff" }}></span>
              <span style={{ fontSize: "0.78rem" }}>Refactoring...</span>
            </>
          ) : (
            <>
              <Play size={12} fill="#ffffff" />
              <span style={{ fontSize: "0.78rem" }}>Start Agent</span>
            </>
          )}
        </button>

        {/* Server Config Settings Button */}
        <button
          ref={settingsButtonRef}
          className="btn-secondary"
          onClick={() => {
            setShowSettings(!showSettings);
            setShowProfileMenu(false);
          }}
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

        {/* User Profile Avatar & Menu Button */}
        {user && (
          <button
            ref={profileButtonRef}
            className="btn-secondary"
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowSettings(false);
            }}
            title={`Logged in as ${user.name} (${user.provider})`}
            style={{
              padding: "0 8px 0 6px",
              flexShrink: 0,
              gap: "6px",
              display: "flex",
              alignItems: "center",
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              height: "34px"
            }}
          >
            <div
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                background: user.provider === "github" ? "#24292e" : user.provider === "google" ? "#4285F4" : user.provider === "demo" ? "#f59e0b" : "var(--accent-cyan)",
                color: "#ffffff",
                fontSize: "11px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden"
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)", maxWidth: "110px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.name}
            </span>
          </button>
        )}
      </div>

      {/* User Profile Dropdown */}
      {showProfileMenu && user && (
        <div
          ref={profileDropdownRef}
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
            width: "280px",
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: user.provider === "github" ? "#24292e" : user.provider === "google" ? "#4285F4" : user.provider === "demo" ? "#f59e0b" : "var(--accent-cyan)",
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#ffffff" }}>{user.name}</div>
              <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.email}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "var(--bg-tertiary)",
              padding: "6px 10px",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.74rem"
            }}
          >
            <span style={{ color: "var(--text-secondary)" }}>Auth Method:</span>
            <span style={{ fontWeight: 600, color: "var(--accent-cyan)", textTransform: "capitalize" }}>
              {user.provider === "demo" ? "⚡ Demo Judge" : user.provider === "github" ? "🐙 GitHub" : user.provider === "google" ? "🌐 Google" : "🔑 Credentials"}
            </span>
          </div>

          <button
            onClick={() => {
              signOut();
              setShowProfileMenu(false);
            }}
            style={{
              width: "100%",
              background: "rgba(244, 63, 94, 0.12)",
              border: "1px solid rgba(244, 63, 94, 0.35)",
              color: "#fda4af",
              padding: "8px 12px",
              borderRadius: "var(--radius-md)",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "all 0.15s ease"
            }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      )}

      {/* Settings Modal Dropdown */}
      {showSettings && (
        <div
          ref={settingsDropdownRef}
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
                const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
                const defUrl = isLocal ? "http://localhost:8000" : DEFAULT_PRODUCTION_BACKEND_URL;
                setServerUrlInput(defUrl);
                setServerUrl(defUrl);
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

