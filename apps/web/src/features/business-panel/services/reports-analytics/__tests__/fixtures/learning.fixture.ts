import type { ReportsAnalyticsQueryData } from "./types";

export const assignmentsFixture = [
  {
    id: "assignment-1",
    user_id: "user-1",
    course_id: "course-1",
    status: "completed",
    completion_percentage: 100,
    assigned_at: "2025-12-01T00:00:00.000Z",
    due_date: "2026-03-01T00:00:00.000Z",
    completed_at: "2025-12-15T00:00:00.000Z",
    updated_at: "2025-12-15T00:00:00.000Z",
    courses: { id: "course-1", title: "IA para ventas" },
  },
] satisfies ReportsAnalyticsQueryData["assignments"];

export const emptyLearningFixtures = {
  enrollments: [],
  lessonProgress: [],
  quizSubmissions: [],
  studySessions: [],
} satisfies Pick<
  ReportsAnalyticsQueryData,
  "enrollments" | "lessonProgress" | "quizSubmissions" | "studySessions"
>;
