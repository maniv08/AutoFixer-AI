export type AgentState =
  | "IDLE"
  | "PLANNING"
  | "CLONING"
  | "ANALYZING"
  | "RUNNING_TESTS"
  | "RUNNING"
  | "OBSERVING"
  | "ANALYZING_FAILURE"
  | "ROOT_CAUSE_FOUND"
  | "FIXING"
  | "RETESTING"
  | "REFLECTING"
  | "CORRECTING"
  | "COMPLETED"
  | "SUCCESS"
  | "FAILED"
  | "HUMAN_INTERVENTION";

export interface TestCounts {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  errors: number;
  duration_seconds: number;
}

export interface TestSummary {
  initial: TestCounts | null;
  current: TestCounts | null;
  target_all_passed: boolean;
  failed_test_names: string[];
}

export interface Hypothesis {
  symptom: string;
  hypothesis: string;
  root_cause: string;
  confidence: number;
  affected_files: string[];
  proposed_fix: string;
}

export interface Reflection {
  observation: string;
  hypothesis: string;
  evidence: string;
  previous_action: string;
  why_it_failed: string;
  new_plan: string;
  expected_result: string;
  user_summary: string;
}

export interface PatchInfo {
  attempt: number;
  target_file: string;
  diff_content: string;
  explanation: string;
  timestamp: string;
}

export interface HumanEscalationDetails {
  what_was_tried: string[];
  current_hypothesis: string;
  files_touched: string[];
  remaining_failures: string[];
  recommended_next_step: string;
}

export interface FinalReport {
  run_id: string;
  repo_url: string;
  repo_name: string;
  branch: string;
  language: string;
  framework: string;
  test_framework: string;
  initial_test_results: TestCounts | null;
  final_test_results: TestCounts | null;
  root_causes: Hypothesis[];
  reflections: Reflection[];
  files_modified: string[];
  patches: PatchInfo[];
  attempts_count: number;
  max_attempts: number;
  execution_time_seconds: number;
  status: AgentState;
  human_escalation?: HumanEscalationDetails;
  created_at: string;
  markdown_report: string;
}

export interface AgentEvent {
  event_id: string;
  run_id: string;
  event_type:
    | "state_change"
    | "tool_start"
    | "tool_end"
    | "terminal"
    | "test_update"
    | "patch"
    | "hypothesis"
    | "reflection"
    | "report"
    | "error";
  timestamp: string;
  data: Record<string, any>;
  state?: AgentState;
  attempt?: number;
}
