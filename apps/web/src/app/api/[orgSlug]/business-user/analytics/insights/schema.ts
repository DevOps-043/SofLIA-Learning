import { z } from 'zod';

export const businessUserInsightsSchema = z.object({
  range: z.enum(['30d', '90d', '180d', '365d']).optional(),
  locale: z.enum(['es', 'en', 'pt']).optional(),
});

export type BusinessUserInsightsBody = z.infer<
  typeof businessUserInsightsSchema
>;
