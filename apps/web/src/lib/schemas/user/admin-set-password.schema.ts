import { z } from 'zod'
import { NewPasswordFieldSchema } from './change-password.schema'

/**
 * Set administrativo de contraseña (Panel Maestro del superadmin).
 * Mismas reglas de complejidad que el cambio self-service, sin contraseña actual.
 */
export const AdminSetPasswordSchema = z.object({
  new_password: NewPasswordFieldSchema,
  confirm_password: z.string()
    .min(1, 'Debe confirmar la nueva contraseña'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm_password'],
})

export type AdminSetPasswordInput = z.infer<typeof AdminSetPasswordSchema>
