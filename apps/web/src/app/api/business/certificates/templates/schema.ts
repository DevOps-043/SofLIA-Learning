import { z } from 'zod'

const designConfigSchema = z.record(z.unknown())

export const certificateTemplateCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2_000).nullable().optional(),
  design_config: designConfigSchema,
  is_default: z.boolean().optional(),
})

export const certificateTemplateUpdateSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2_000).nullable().optional(),
  design_config: designConfigSchema.optional(),
  is_default: z.boolean().optional(),
  is_active: z.boolean().optional(),
})

export type CertificateTemplateCreateBody = z.infer<
  typeof certificateTemplateCreateSchema
>
export type CertificateTemplateUpdateBody = z.infer<
  typeof certificateTemplateUpdateSchema
>
