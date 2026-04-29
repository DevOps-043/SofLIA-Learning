import { z } from 'zod';
import { TFunction } from 'i18next';

export const getRegisterSchema = (t: TFunction) => z
  .object({
    firstName: z
      .string()
      .min(2, t('auth.register.validation.firstNameMin'))
      .max(50, t('auth.register.validation.firstNameMax'))
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, t('auth.register.validation.onlyLetters')),
    lastName: z
      .string()
      .min(2, t('auth.register.validation.lastNameMin'))
      .max(50, t('auth.register.validation.lastNameMax'))
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, t('auth.register.validation.onlyLetters')),
    username: z
      .string()
      .min(3, t('auth.register.validation.usernameMin'))
      .max(20, t('auth.register.validation.usernameMax'))
      .regex(/^[a-zA-Z0-9_]+$/, t('auth.register.validation.onlyAlphanumericUnderscore')),
    countryCode: z.string().min(1, t('auth.register.validation.countryRequired')),
    phoneNumber: z
      .string()
      .min(8, t('auth.register.validation.phoneMin'))
      .max(15, t('auth.register.validation.phoneMax'))
      .regex(/^[0-9]+$/, t('auth.register.validation.onlyNumbers')),
    dateOfBirth: z.string().optional(),
    gender: z.string().nullable().optional(),
    email: z.string().email(t('auth.register.validation.invalidEmail')),
    confirmEmail: z.string().email(t('auth.register.validation.invalidEmail')),
    password: z
      .string()
      .min(8, t('auth.register.validation.passwordMin'))
      .regex(/[A-Z]/, t('auth.register.validation.passwordUppercase'))
      .regex(/[a-z]/, t('auth.register.validation.passwordLowercase'))
      .regex(/[0-9]/, t('auth.register.validation.passwordNumber'))
      .regex(/[^a-zA-Z0-9]/, t('auth.register.validation.passwordSpecial')),
    confirmPassword: z.string(),
    cargo_titulo: z
      .string()
      .max(100, t('auth.register.validation.roleMax'))
      .optional(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: t('auth.register.validation.acceptTermsRequired'),
    }),
  })
  .refine((data) => data.email === data.confirmEmail, {
    message: t('auth.register.validation.emailsDoNotMatch'),
    path: ['confirmEmail'],
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: t('auth.register.validation.passwordsDoNotMatch'),
    path: ['confirmPassword'],
  });
