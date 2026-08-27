/**
 * Global Frontend Configuration for API & WebSocket Server endpoints.
 */

export const DEFAULT_PRODUCTION_BACKEND_URL = "https://autofixer-ai-1025.onrender.com";

export function getServerUrl(): string {
  // 1. Check local storage override if user customized in UI
  const stored = localStorage.getItem("autofixer_server_url");
  if (stored && stored.trim()) {
    return stored.trim().replace(/\/+$/, "");
  }

  // 2. Check environment variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, "");
  }

  // 3. If running locally in dev (localhost or 127.0.0.1), use localhost:8000
  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ) {
    return "http://localhost:8000";
  }

  // 4. Default for all public visitors on Vercel/Web: Connect directly to live Render cloud backend!
  return DEFAULT_PRODUCTION_BACKEND_URL;
}

export function setServerUrl(url: string): void {
  if (url && url.trim()) {
    localStorage.setItem("autofixer_server_url", url.trim().replace(/\/+$/, ""));
  } else {
    localStorage.removeItem("autofixer_server_url");
  }
}

export function getWebSocketUrl(runId: string): string {
  const customWs = import.meta.env.VITE_WS_URL;
  if (customWs) {
    return `${customWs.replace(/\/+$/, "")}/ws/runs/${runId}`;
  }

  const serverUrl = getServerUrl();
  const wsProtocol = serverUrl.startsWith("https") ? "wss:" : "ws:";
  const hostPart = serverUrl.replace(/^https?:\/\//, "");

  return `${wsProtocol}//${hostPart}/ws/runs/${runId}`;
}
