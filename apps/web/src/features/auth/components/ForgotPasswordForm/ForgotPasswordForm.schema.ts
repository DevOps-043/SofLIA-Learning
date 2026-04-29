import { z } from 'zod';
import { TFunction } from 'i18next';

export const getForgotPasswordSchema = (t: TFunction) => z.object({
  email: z.string().email(t('auth.forgotPassword.validation.invalidEmail')),
});

export type ForgotPasswordFormData = {
  email: string;
};
