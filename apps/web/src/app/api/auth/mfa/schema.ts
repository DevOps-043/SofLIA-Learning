import { z } from 'zod';

export const tokenSchema = z.object({
  token: z
    .string()
    .min(4)
    .max(64)
    .regex(/^[A-Z0-9]+$/u, 'TOKEN_MUST_BE_ALPHANUMERIC_UPPERCASE'),
});

export const loginChallengeTokenSchema = tokenSchema.extend({
  challengeToken: z.string().min(32).max(4096),
});

export const activateSchema = z.object({
  factorId: z.string().uuid(),
  token: z.string().min(4).max(8).regex(/^\d+$/u, 'TOKEN_MUST_BE_NUMERIC'),
});

export type TokenInput = z.infer<typeof tokenSchema>;
export type LoginChallengeTokenInput = z.infer<typeof loginChallengeTokenSchema>;
export type ActivateInput = z.infer<typeof activateSchema>;
