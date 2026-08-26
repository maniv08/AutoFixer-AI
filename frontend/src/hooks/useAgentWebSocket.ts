import { useEffect, useRef, useState } from "react";
import type { AgentEvent, AgentState, FinalReport, Hypothesis, PatchInfo, Reflection, TestSummary } from "../types";
import { getWebSocketUrl } from "../config";

export function useAgentWebSocket(runId: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const [state, setState] = useState<AgentState>("IDLE");
  const [attempt, setAttempt] = useState<number>(1);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [testSummary, setTestSummary] = useState<TestSummary | null>(null);
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [patches, setPatches] = useState<PatchInfo[]>([]);
  const [finalReport, setFinalReport] = useState<FinalReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!runId) return;

    // Reset state for new run
    setEvents([]);
    setTerminalLogs([]);
    setTestSummary(null);
    setHypotheses([]);
    setReflections([]);
    setPatches([]);
    setFinalReport(null);
    setError(null);
    setState("PLANNING");
    setAttempt(1);

    const wsUrl = getWebSocketUrl(runId);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const parsed: AgentEvent = JSON.parse(event.data);
        setEvents((prev) => [...prev, parsed]);

        if (parsed.state) {
          setState(parsed.state);
        }
        if (parsed.attempt) {
          setAttempt(parsed.attempt);
        }

        switch (parsed.event_type) {
          case "terminal":
            if (parsed.data?.line) {
              setTerminalLogs((prev) => [...prev, parsed.data.line]);
            }
            break;
          case "test_update":
            if (parsed.data?.test_summary) {
              setTestSummary(parsed.data.test_summary);
            }
            break;
          case "hypothesis":
            if (parsed.data?.hypothesis) {
              setHypotheses((prev) => [...prev, parsed.data.hypothesis]);
            }
            break;
          case "reflection":
            if (parsed.data?.reflection) {
              setReflections((prev) => [...prev, parsed.data.reflection]);
            }
            break;
          case "patch":
            if (parsed.data?.patch) {
              setPatches((prev) => [...prev, parsed.data.patch]);
            }
            break;
          case "report":
            if (parsed.data?.report) {
              setFinalReport(parsed.data.report);
            }
            break;
          case "error":
            if (parsed.data?.error) {
              setError(parsed.data.error);
            }
            break;
        }
      } catch (err) {
        console.error("Failed to parse websocket message:", err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [runId]);

  return {
    isConnected,
    state,
    attempt,
    events,
    terminalLogs,
    testSummary,
    hypotheses,
    reflections,
    patches,
    finalReport,
    error
  };
}
