import { z } from 'zod'

export const dashboardLayoutSchema = z.object({
  name: z.string().trim().min(1).max(200),
  layout_config: z.record(z.unknown()),
  is_default: z.boolean().optional(),
})

export type DashboardLayoutBody = z.infer<typeof dashboardLayoutSchema>
