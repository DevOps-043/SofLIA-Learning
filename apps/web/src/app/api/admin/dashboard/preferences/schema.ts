import { z } from 'zod';

export const adminDashboardPreferenceMetricSchema = z.enum([
  'users',
  'courses',
  'communities',
  'prompts',
  'aiApps',
]);

export const adminDashboardPreferencesSchema = z
  .object({
    activity_period: z.enum(['24h', '7d', '30d']).optional(),
    growth_chart_metrics: z
      .array(adminDashboardPreferenceMetricSchema)
      .min(1)
      .max(5)
      .optional(),
  })
  .strict();

export type AdminDashboardPreferencesBody = z.infer<typeof adminDashboardPreferencesSchema>;
