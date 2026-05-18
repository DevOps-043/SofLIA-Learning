import { z } from 'zod'

export const DEFAULT_USER_GROUP_COLOR = 'var(--color-primary)'

const colorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/)

export const userGroupCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).nullable().optional(),
  color: colorSchema.nullable().optional(),
}).strict()

export const userGroupUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  color: colorSchema.nullable().optional(),
}).strict()

export type UserGroupCreateBody = z.infer<typeof userGroupCreateSchema>
export type UserGroupUpdateBody = z.infer<typeof userGroupUpdateSchema>
