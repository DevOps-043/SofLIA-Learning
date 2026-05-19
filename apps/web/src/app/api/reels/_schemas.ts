import { z } from 'zod';

export const reelUpdateSchema = z.object({
  category: z.string().max(100).nullable().optional(),
  description: z.string().max(2_000).nullable().optional(),
  hashtags: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
  title: z.string().trim().min(1).max(200).optional(),
});

export const reelCommentSchema = z.object({
  content: z.string().trim().min(1).max(5_000),
});

export type ReelCommentBody = z.infer<typeof reelCommentSchema>;
export type ReelUpdateBody = z.infer<typeof reelUpdateSchema>;
