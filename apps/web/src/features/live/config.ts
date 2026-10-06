export const LIVE_LEARNING_ENABLED =
  process.env.NEXT_PUBLIC_LIVE_LEARNING_ENABLED === "true";
export const LIVE_LIMITS = {
  sessionPage: 20,
  coursePage: 50,
  instructorPage: 50,
  messages: 100,
  activities: 100,
  fileBytes: 10 * 1024 * 1024,
  publicChatPerMinute: 30,
  aiPerMinute: 10,
  mutationsPerMinute: 120,
} as const;
