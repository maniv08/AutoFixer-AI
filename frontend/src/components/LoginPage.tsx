import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Brain,
  Eye,
  EyeOff,
  Terminal,
  AlertCircle,
  FolderGit2
} from "lucide-react";

export const LoginPage: React.FC = () => {
  const { signInWithGithub, signInWithGoogle, signInWithCredentials } = useAuth();

  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingType, setLoadingType] = useState<string | null>(null);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoadingType("credentials");

    const result = await signInWithCredentials(
      usernameOrEmail,
      password,
      fullName,
      mode === "register"
    );

    if (!result.success && result.error) {
      setErrorMsg(result.error);
    }
    setLoadingType(null);
  };

  const handleGithubLogin = async () => {
    setErrorMsg(null);
    setLoadingType("github");
    try {
      await signInWithGithub();
    } finally {
      setLoadingType(null);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setLoadingType("google");
    try {
      await signInWithGoogle();
    } finally {
      setLoadingType(null);
    }
  };


  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(ellipse at 50% 15%, #0f1d36 0%, #090c10 75%)",
        padding: "24px 16px",
        fontFamily: "var(--font-sans)",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Background Decorative Glow Circles */}
      <div
        style={{
          position: "absolute",
          top: "-120px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "400px",
          background: "radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, rgba(59, 130, 246, 0.05) 50%, transparent 80%)",
          pointerEvents: "none",
          zIndex: 0
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: "1080px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: "28px",
          alignItems: "center",
          position: "relative",
          zIndex: 1
        }}
      >
        {/* Left Side: Product Branding & Live Feature Highlights */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", padding: "12px" }}>
          {/* Logo & Headline */}
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div
                style={{
                  background: "linear-gradient(135deg, #0284c7, #06b6d4)",
                  width: "44px",
                  height: "44px",
                  borderRadius: "var(--radius-md)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 16px rgba(6, 182, 212, 0.45)"
                }}
              >
                <Cpu size={26} color="#ffffff" />
              </div>
              <div>
                <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.5px" }}>
                  AutoFixer <span style={{ color: "var(--accent-cyan)" }}>AI</span>
                </h1>
                <p style={{ fontSize: "11px", color: "var(--accent-cyan)", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase" }}>
                  Autonomous QA & Refactoring Agent
                </p>
              </div>
            </div>

            <h2 style={{ fontSize: "28px", fontWeight: 700, lineHeight: 1.25, color: "#f8fafc", marginBottom: "12px" }}>
              Give it broken code. <br />
              <span style={{ background: "linear-gradient(90deg, #38bdf8, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                It tests, repairs, reflects, and verifies.
              </span>
            </h2>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Autonomous multi-step diagnostic loop powered by AST validation, process-level sandbox security, and traceback-guided surgical diffs.
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-cyan)", marginBottom: "4px", fontSize: "12px", fontWeight: 600 }}>
                <ShieldCheck size={16} /> AST Syntax Gate
              </div>
              <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>Pre-patch validation prevents 100% of syntax errors before write.</p>
            </div>
            <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-purple)", marginBottom: "4px", fontSize: "12px", fontWeight: 600 }}>
                <Brain size={16} /> Self-Correction
              </div>
              <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>Structured reflection loops recover from partial test failures.</p>
            </div>
            <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-emerald)", marginBottom: "4px", fontSize: "12px", fontWeight: 600 }}>
                <Terminal size={16} /> 17 Sandbox Tools
              </div>
              <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>Process-level test runs with strict wall-clock timeouts.</p>
            </div>
            <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-blue)", marginBottom: "4px", fontSize: "12px", fontWeight: 600 }}>
                <FolderGit2 size={16} /> Auto Rollback
              </div>
              <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>Automated regression detection reverts deteriorating patches.</p>
            </div>
          </div>
        </div>

        {/* Right Side: Authentication Form Card */}
        <div
          style={{
            background: "rgba(18, 24, 36, 0.95)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(56, 189, 248, 0.2)",
            borderRadius: "12px",
            padding: "32px 28px",
            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.6), 0 0 24px rgba(6, 182, 212, 0.15)",
            display: "flex",
            flexDirection: "column",
            gap: "20px"
          }}
        >
          {/* Form Header Tabs */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                onClick={() => { setMode("signin"); setErrorMsg(null); }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: mode === "signin" ? "var(--accent-cyan)" : "var(--text-secondary)",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: "pointer",
                  paddingBottom: "4px",
                  borderBottom: mode === "signin" ? "2px solid var(--accent-cyan)" : "2px solid transparent",
                  transition: "all 0.15s ease"
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode("register"); setErrorMsg(null); }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: mode === "register" ? "var(--accent-cyan)" : "var(--text-secondary)",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: "pointer",
                  paddingBottom: "4px",
                  borderBottom: mode === "register" ? "2px solid var(--accent-cyan)" : "2px solid transparent",
                  transition: "all 0.15s ease"
                }}
              >
                Create Account
              </button>
            </div>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", background: "var(--bg-tertiary)", padding: "3px 8px", borderRadius: "var(--radius-sm)" }}>
              v1.0.0
            </span>
          </div>

          {/* Social / OAuth Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {/* GitHub OAuth Button */}
            <button
              type="button"
              onClick={handleGithubLogin}
              disabled={loadingType !== null}
              style={{
                width: "100%",
                background: "#24292e",
                border: "1px solid #444d56",
                color: "#ffffff",
                padding: "11px 16px",
                borderRadius: "var(--radius-md)",
                fontSize: "13.5px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                transition: "all 0.15s ease",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#2f363d")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#24292e")}
            >
              {loadingType === "github" ? (
                <span>Connecting GitHub...</span>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  Continue with GitHub
                </>
              )}
            </button>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loadingType !== null}
              style={{
                width: "100%",
                background: "#ffffff",
                border: "1px solid #d1d5db",
                color: "#1f2937",
                padding: "11px 16px",
                borderRadius: "var(--radius-md)",
                fontSize: "13.5px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                transition: "all 0.15s ease",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
            >
              {loadingType === "google" ? (
                <span style={{ color: "#374151" }}>Connecting Google...</span>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                  </svg>
                  Continue with Google
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ flex: 1, height: "1px", background: "var(--border-color)" }} />
            <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
              or with credentials
            </span>
            <div style={{ flex: 1, height: "1px", background: "var(--border-color)" }} />
          </div>

          {/* Error Message Box */}
          {errorMsg && (
            <div
              style={{
                background: "rgba(244, 63, 94, 0.12)",
                border: "1px solid rgba(244, 63, 94, 0.4)",
                color: "#fda4af",
                padding: "10px 12px",
                borderRadius: "var(--radius-md)",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <AlertCircle size={16} color="#f43f5e" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleCredentialsSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {mode === "register" && (
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Full Name
                </label>
                <div style={{ position: "relative" }}>
                  <UserIcon size={16} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "12px" }} />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    style={{
                      width: "100%",
                      background: "var(--bg-tertiary)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--radius-md)",
                      padding: "10px 12px 10px 38px",
                      color: "#ffffff",
                      fontSize: "13px",
                      outline: "none"
                    }}
                  />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                Username or Email Address
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={16} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "12px" }} />
                <input
                  type="text"
                  required
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="developer@company.com"
                  style={{
                    width: "100%",
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-md)",
                    padding: "10px 12px 10px 38px",
                    color: "#ffffff",
                    fontSize: "13px",
                    outline: "none"
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
                  Password
                </label>
                {mode === "signin" && (
                  <span
                    onClick={() => alert("For this demonstration, you can enter any username and password (min 4 chars) or use the 1-Click Judge Access.")}
                    style={{ fontSize: "11px", color: "var(--accent-cyan)", cursor: "pointer" }}
                  >
                    Forgot password?
                  </span>
                )}
              </div>
              <div style={{ position: "relative" }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "12px" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-md)",
                    padding: "10px 38px 10px 38px",
                    color: "#ffffff",
                    fontSize: "13px",
                    outline: "none"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "10px",
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer"
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingType !== null}
              style={{
                width: "100%",
                background: "linear-gradient(135deg, #0284c7, #06b6d4)",
                border: "none",
                color: "#ffffff",
                padding: "11px 16px",
                borderRadius: "var(--radius-md)",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginTop: "6px",
                boxShadow: "0 0 16px rgba(6, 182, 212, 0.4)",
                transition: "all 0.15s ease"
              }}
            >
              {loadingType === "credentials" ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>{mode === "signin" ? "Sign In to AutoFixer" : "Create Developer Account"}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div style={{ textAlign: "center", fontSize: "11px", color: "var(--text-muted)" }}>
            Protected by AST Syntax Analysis & Process-Isolated Sandbox
          </div>
        </div>
      </div>
    </div>
  );
};
