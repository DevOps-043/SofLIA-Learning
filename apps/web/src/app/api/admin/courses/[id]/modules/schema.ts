import { z } from 'zod'

export const createModuleSchema = z.object({
  module_title: z.string().min(1).max(200),
  module_description: z.string().max(2000).optional(),
  is_required: z.boolean().optional(),
  is_published: z.boolean().optional(),
})

export type CreateModuleBody = z.infer<typeof createModuleSchema>

export const updateModuleSchema = z.object({
  module_title: z.string().min(1).max(200).optional(),
  module_description: z.string().max(2000).optional(),
  is_required: z.boolean().optional(),
  is_published: z.boolean().optional(),
})

export type UpdateModuleBody = z.infer<typeof updateModuleSchema>

export const reorderModulesSchema = z.object({
  modules: z
    .array(
      z.object({
        module_id: z.string().uuid(),
        module_order_index: z.number().int().min(0).max(10_000),
      }),
    )
    .min(1)
    .max(500),
})

export type ReorderModulesBody = z.infer<typeof reorderModulesSchema>
