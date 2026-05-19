import { z } from 'zod'

const hexColorSchema = z.string().trim().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)

export const businessStyleSchema = z
  .object({
    background_type: z.enum(['image', 'color', 'gradient']),
    background_value: z.string().trim().min(1).max(2_000),
    primary_button_color: hexColorSchema,
    secondary_button_color: hexColorSchema,
    accent_color: hexColorSchema,
  })
  .passthrough()

export const businessStylesUpdateSchema = z.object({
  panel: businessStyleSchema.optional(),
  userDashboard: businessStyleSchema.optional(),
  login: businessStyleSchema.optional(),
})

export const businessThemeApplySchema = z.object({
  themeId: z.string().trim().min(1).max(120),
})

export type BusinessStyleInput = z.infer<typeof businessStyleSchema>
export type BusinessStylesUpdateBody = z.infer<typeof businessStylesUpdateSchema>
export type BusinessThemeApplyBody = z.infer<typeof businessThemeApplySchema>
