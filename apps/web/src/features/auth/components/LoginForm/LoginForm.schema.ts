import { z } from 'zod';

export const loginSchema = z.object({
  emailOrUsername: z
    .string()
    .min(1, 'El correo o usuario es requerido')
    .regex(/^\S+$/, 'No se permiten espacios'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .regex(/^\S+$/, 'No se permiten espacios'),
  rememberMe: z.boolean().default(false),
});
