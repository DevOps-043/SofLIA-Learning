import { z } from 'zod'

export const courseAssignSchema = z.object({
  user_ids: z.array(z.string().uuid()).min(1).max(1_000),
  due_date: z.string().trim().max(80).nullable().optional(),
  start_date: z.string().trim().max(80).nullable().optional(),
  approach: z.enum(['fast', 'balanced', 'long', 'custom']).nullable().optional(),
  message: z.string().trim().max(2_000).nullable().optional(),
})

export type CourseAssignBody = z.infer<typeof courseAssignSchema>
