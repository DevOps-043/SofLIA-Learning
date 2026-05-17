import { z } from 'zod';

import { hasDangerousPattern, isCommonPassword } from './checks';
import { PASSWORD_REQUIREMENTS } from './types';

export const passwordSchema = z
  .string()
  .min(PASSWORD_REQUIREMENTS.minLength, {
    message: `La contraseña debe tener al menos ${PASSWORD_REQUIREMENTS.minLength} caracteres`,
  })
  .max(PASSWORD_REQUIREMENTS.maxLength, {
    message: `La contraseña no puede exceder ${PASSWORD_REQUIREMENTS.maxLength} caracteres`,
  })
  .regex(/[a-z]/, {
    message: 'La contraseña debe contener al menos una letra minúscula',
  })
  .regex(/[A-Z]/, {
    message: 'La contraseña debe contener al menos una letra mayúscula',
  })
  .regex(/[0-9]/, {
    message: 'La contraseña debe contener al menos un número',
  })
  .regex(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/, {
    message: 'La contraseña debe contener al menos un carácter especial',
  })
  .refine((password) => !isCommonPassword(password), {
    message: 'Esta contraseña es muy común. Por favor elige otra más segura',
  })
  .refine((password) => !hasDangerousPattern(password), {
    message: 'La contraseña contiene un patrón inseguro (caracteres repetidos o secuencias)',
  });

export const passwordConfirmationSchema = z
  .object({
    password: passwordSchema,
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'Las contraseñas no coinciden',
    path: ['passwordConfirmation'],
  });
