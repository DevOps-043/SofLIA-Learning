import { z } from 'zod'

export const nonEmptyStringSchema = z.string().trim().min(1)
export const sortDirectionSchema = z.enum(['asc', 'desc'])

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})
