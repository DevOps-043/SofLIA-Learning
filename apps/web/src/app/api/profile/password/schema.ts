import { z } from 'zod';
import { passwordSchema } from '@/lib/validation/password-security';

export const passwordChangeSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'CURRENT_PASSWORD_REQUIRED')
      .max(200)
      .refine((value) => !/\s/.test(value), 'PASSWORD_NO_WHITESPACE'),
    newPassword: passwordSchema
      .refine((value) => !/\s/.test(value), 'PASSWORD_NO_WHITESPACE'),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'PASSWORD_MUST_BE_DIFFERENT',
    path: ['newPassword'],
  });

export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
