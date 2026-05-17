import { z } from 'zod'

export const dialogueCriterionSchema = z
  .object({
    id: z.string().trim().min(1).max(100),
    label: z.string().trim().min(1).max(240),
    description: z.string().trim().max(1000).optional(),
    required: z.boolean().default(true),
  })
  .strict()

export const dialogueRubricDimensionSchema = z
  .object({
    id: z.string().trim().min(1).max(100),
    label: z.string().trim().min(1).max(240),
    description: z.string().trim().max(1200).optional(),
    weight: z.number().min(0).max(100).default(20),
  })
  .strict()

export const dialogueHintSchema = z
  .object({
    id: z.string().trim().min(1).max(100),
    level: z.number().int().min(1).max(5),
    content: z.string().trim().min(1).max(1200),
    targetCriterionId: z.string().trim().max(100).optional(),
  })
  .strict()

const dialogueContextAdaptationFocusSchema = z.enum([
  'scale',
  'industry',
  'role',
  'mission',
  'country',
])

export const dialogueContextAdaptationSchema = z
  .object({
    enabled: z.boolean().default(true),
    instructions: z.string().trim().max(1000).optional(),
    focus: z.array(dialogueContextAdaptationFocusSchema).max(5).default([]),
  })
  .strict()
  .default({})
