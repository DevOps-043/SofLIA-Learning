import { z } from 'zod';

export const requestResetSchema = z.object({
  email: z.string().email('Email inválido'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  newPassword: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
});

export function parsePasswordResetRequest(formData: FormData | { email: string }): string {
  const parsed =
    formData instanceof FormData
      ? requestResetSchema.parse({ email: formData.get('email') })
      : requestResetSchema.parse(formData);

  return parsed.email;
}

export function parsePasswordResetPayload(
  formData: FormData | { token: string; newPassword: string }
): { newPassword: string; token: string } {
  const parsed =
    formData instanceof FormData
      ? resetPasswordSchema.parse({
          newPassword: formData.get('newPassword'),
          token: formData.get('token'),
        })
      : resetPasswordSchema.parse(formData);

  return parsed;
}
