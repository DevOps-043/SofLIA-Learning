import { z } from 'zod';

export const courseRatingSchema = z.object({
  rating: z.number().int().min(1).max(5),
  review_title: z.string().trim().max(200).optional().nullable(),
  review_content: z
    .string()
    .trim()
    .min(1, 'REVIEW_CONTENT_NOT_EMPTY')
    .max(4000)
    .optional()
    .nullable(),
});

export type CourseRatingInput = z.infer<typeof courseRatingSchema>;
