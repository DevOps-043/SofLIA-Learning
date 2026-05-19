import { z } from 'zod';

const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().max(50_000),
});

export const studyPlannerChatSchema = z.object({
  message: z.string().min(1).max(50_000),
  conversationHistory: z.array(chatMessageSchema).max(50).optional(),
  systemPrompt: z.string().min(1).max(100_000),
  userId: z.string().max(200).optional(),
  userName: z.string().max(200).optional(),
});

export type StudyPlannerChatBody = z.infer<typeof studyPlannerChatSchema>;
