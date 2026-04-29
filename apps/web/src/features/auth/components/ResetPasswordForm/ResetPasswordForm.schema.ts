import { z } from 'zod';
import { TFunction } from 'i18next';

export const getResetPasswordSchema = (t: TFunction) => z
  .object({
    newPassword: z
      .string()
      .min(8, t('auth.resetPassword.validation.passwordMin'))
      .regex(/[A-Z]/, t('auth.resetPassword.validation.passwordUppercase'))
      .regex(/[a-z]/, t('auth.resetPassword.validation.passwordLowercase'))
      .regex(/[0-9]/, t('auth.resetPassword.validation.passwordNumber')),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: t('auth.resetPassword.validation.passwordsDoNotMatch'),
    path: ['confirmPassword'],
  });

export type ResetPasswordFormData = z.infer<ReturnType<typeof getResetPasswordSchema>>;
