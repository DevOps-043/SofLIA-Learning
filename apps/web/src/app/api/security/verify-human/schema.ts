import { z } from 'zod';

export const verifyHumanSchema = z.object({
  holdDurationMs: z.number().int().min(0).max(60_000).optional(),
  returnTo: z.string().min(1).max(2048).optional(),
});

export type VerifyHumanInput = z.infer<typeof verifyHumanSchema>;
