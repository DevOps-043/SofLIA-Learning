import { z } from 'zod';
import { TFunction } from 'i18next';

export const getLoginSchema = (t: TFunction) => z.object({
  emailOrUsername: z
    .string()
    .min(1, t('auth.login.validation.emailOrUsernameRequired'))
    .regex(/^\S+$/, t('auth.login.validation.noSpaces')),
  password: z
    .string()
    .min(1, t('auth.login.validation.passwordRequired'))
    .regex(/^\S+$/, t('auth.login.validation.noSpaces')),
  rememberMe: z.boolean().default(false),
});
