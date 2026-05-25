import { z } from 'zod';

const widgetPositionSchema = z
  .object({
    h: z.number().int().min(1).max(100),
    w: z.number().int().min(1).max(100),
    x: z.number().int().min(0).max(100),
    y: z.number().int().min(0).max(100),
  })
  .strict();

const widgetConfigSchema = z
  .object({
    id: z.string().trim().min(1).max(100),
    position: widgetPositionSchema,
    type: z.string().trim().min(1).max(100),
  })
  .strict();

export const adminDashboardLayoutSchema = z
  .object({
    is_default: z.boolean().default(true),
    layout_config: z
      .object({
        widgets: z.array(widgetConfigSchema).min(1).max(50),
      })
      .strict(),
    name: z.string().trim().min(1).max(120),
  })
  .strict();

export type AdminDashboardLayoutBody = z.infer<typeof adminDashboardLayoutSchema>;
