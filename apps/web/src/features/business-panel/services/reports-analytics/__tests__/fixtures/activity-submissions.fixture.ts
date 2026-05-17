import type { ReportsAnalyticsQueryData } from "./types";

export const activitySubmissionsFixture = [
  {
    submission_id: "submission-1",
    user_id: "user-1",
    organization_id: "org-1",
    course_id: "course-1",
    lesson_id: "lesson-1",
    activity_id: "activity-2",
    enrollment_id: "enrollment-1",
    status: "validated",
    response_text: "Use IA para preparar un plan de seguimiento comercial.",
    response_payload: null,
    evidence_payload: null,
    submitted_at: "2026-02-18T00:00:00.000Z",
    last_validated_at: "2026-02-18T00:05:00.000Z",
    created_at: "2026-02-18T00:00:00.000Z",
    updated_at: "2026-02-18T00:05:00.000Z",
    courses: { id: "course-1", title: "IA para ventas" },
    lesson_activities: null,
  },
] satisfies ReportsAnalyticsQueryData["activitySubmissions"];

export const activityEvaluationsFixture = [
  {
    evaluation_id: "evaluation-1",
    submission_id: "submission-1",
    result_status: "pass",
    feedback_payload: { summary: "Buen trabajo" },
    model_name: "test-model",
    created_at: "2026-02-18T00:05:00.000Z",
  },
] satisfies ReportsAnalyticsQueryData["activityEvaluations"];

export const emptyActivityFixtures = {
  lessonNotes: [],
} satisfies Pick<ReportsAnalyticsQueryData, "lessonNotes">;
