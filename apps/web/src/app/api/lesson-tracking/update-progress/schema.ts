import { z } from 'zod';

export const updateLessonProgressSchema = z.object({
  lessonId: z.string().trim().min(1).max(200),
  trackingId: z.string().trim().min(1).max(200).optional().nullable(),
  checkpoint: z.number().finite().min(0),
  maxReached: z.number().finite().min(0),
  totalDuration: z.number().finite().min(0),
  playbackRate: z.number().finite().min(0).max(16).optional(),
  // Señal del evento `ended` del navegador: el video llegó a su fin natural.
  reachedEnd: z.boolean().optional(),
});

export type UpdateLessonProgressBody = z.infer<typeof updateLessonProgressSchema>;
