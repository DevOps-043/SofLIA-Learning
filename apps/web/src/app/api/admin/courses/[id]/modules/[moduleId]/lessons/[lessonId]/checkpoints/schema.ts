import { z } from 'zod'

export const createCheckpointSchema = z.object({
  checkpoint_time_seconds: z.number().int().min(0).max(60 * 60 * 24),
  checkpoint_label: z.string().min(1).max(200).optional(),
  checkpoint_description: z.string().max(2_000).optional(),
  is_required_completion: z.boolean().optional(),
})

export type CreateCheckpointBody = z.infer<typeof createCheckpointSchema>

export const updateCheckpointSchema = z.object({
  checkpoint_time_seconds: z.number().int().min(0).max(60 * 60 * 24).optional(),
  checkpoint_label: z.string().min(1).max(200).optional(),
  checkpoint_description: z.string().max(2_000).optional(),
  is_required_completion: z.boolean().optional(),
})

export type UpdateCheckpointBody = z.infer<typeof updateCheckpointSchema>
