import type { ReportsAnalyticsQueryData } from "./types";

export const activityCompletionsFixture = [
  {
    completion_id: "completion-1",
    user_id: "user-1",
    activity_id: "activity-1",
    status: "completed",
    completed_steps: 3,
    total_steps: 3,
    time_to_complete_seconds: 180,
    attempts_to_complete: 1,
    user_needed_help: false,
    lia_had_to_redirect: 0,
    generated_output: {
      answer: "Aplicaria IA para priorizar cuentas con mayor probabilidad de cierre.",
    },
    completed_at: "2026-02-16T00:00:00.000Z",
    started_at: "2026-02-16T00:00:00.000Z",
    updated_at: "2026-02-16T00:00:00.000Z",
    lesson_activities: null,
  },
] satisfies ReportsAnalyticsQueryData["activityCompletions"];
