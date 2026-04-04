-- LIA conversations: queries by user in chat history
-- Used in: app/api/lia/conversations/route.ts
CREATE INDEX IF NOT EXISTS idx_lia_conversations_user_id
  ON public.lia_conversations(user_id, created_at DESC);

-- LIA messages: queries by conversation for message history
-- Used in: app/api/lia/conversations/[id]/messages/route.ts
CREATE INDEX IF NOT EXISTS idx_lia_messages_conversation_id
  ON public.lia_messages(conversation_id, created_at ASC);

-- User lesson progress: queries by user and course for progress tracking
-- Used in: multiple app/api/courses/*/learn-data routes
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_course
  ON public.user_lesson_progress(user_id, course_id);
