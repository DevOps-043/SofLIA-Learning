import type { ReportsAnalyticsQueryData } from "./types";

export const liaConversationsFixture = [
  {
    conversation_id: "conversation-1",
    user_id: "user-1",
    course_id: "course-1",
    context_type: "course_lesson",
    conversation_completed: true,
    started_at: "2026-02-17T00:00:00.000Z",
    ended_at: "2026-02-17T00:10:00.000Z",
    created_at: "2026-02-17T00:00:00.000Z",
    updated_at: "2026-02-17T00:10:00.000Z",
    total_messages: 4,
    total_lia_messages: 2,
    total_user_messages: 2,
    courses: { id: "course-1", title: "IA para ventas" },
  },
] satisfies ReportsAnalyticsQueryData["liaConversations"];

export const liaMessagesFixture = [
  {
    message_id: "message-1",
    conversation_id: "conversation-1",
    role: "user",
    content: "Como uso SofLIA para preparar una propuesta comercial?",
    created_at: "2026-02-17T00:01:00.000Z",
    contains_question: true,
    response_time_ms: null,
    is_off_topic: false,
    lia_redirected: false,
    lia_provided_example: false,
    sentiment_score: 0.4,
    user_sentiment: "positive",
    tokens_used: 20,
  },
] satisfies ReportsAnalyticsQueryData["liaMessages"];
