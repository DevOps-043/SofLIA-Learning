import { z } from 'zod'

const hexColorSchema = z
  .string()
  .trim()
  .refine((value) => value === '' || /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value))

const brandingAssetSchema = z.string().trim().max(2_000).nullable().optional()

export const brandingUpdateSchema = z.object({
  logo_url: brandingAssetSchema,
  favicon_url: brandingAssetSchema,
  banner_url: brandingAssetSchema,
  color_primary: hexColorSchema.nullable().optional(),
  color_secondary: hexColorSchema.nullable().optional(),
  color_accent: hexColorSchema.nullable().optional(),
  font_family: z.string().trim().min(1).max(120).nullable().optional(),
})

export type BrandingUpdateBody = z.infer<typeof brandingUpdateSchema>
