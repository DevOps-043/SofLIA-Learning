import { z } from 'zod';

export const toggleFavoriteSchema = z.object({
  userId: z.string().uuid('userId debe ser un UUID valido'),
  courseId: z.string().uuid('courseId debe ser un UUID valido'),
});

export type ToggleFavoriteBody = z.infer<typeof toggleFavoriteSchema>;
