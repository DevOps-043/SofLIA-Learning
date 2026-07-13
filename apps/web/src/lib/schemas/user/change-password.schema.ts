import { z } from 'zod'

/**
 * Reglas de complejidad de contraseña nuevas, compartidas entre el cambio
 * self-service y el set administrativo para que nunca diverjan.
 */
export const NewPasswordFieldSchema = z.string()
  .min(12, 'La nueva contraseña debe tener al menos 12 caracteres')
  .max(100, 'La nueva contraseña no puede exceder 100 caracteres')
  .regex(/[A-Z]/, 'La nueva contraseña debe contener al menos una letra mayúscula')
  .regex(/[a-z]/, 'La nueva contraseña debe contener al menos una letra minúscula')
  .regex(/[0-9]/, 'La nueva contraseña debe contener al menos un número')

export const ChangePasswordSchema = z.object({
  current_password: z.string()
    .min(1, 'La contraseña actual es requerida'),
  new_password: NewPasswordFieldSchema,
  confirm_password: z.string()
    .min(1, 'Debe confirmar la nueva contraseña'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm_password'],
}).refine((data) => {
  if (!data.current_password || !data.new_password) return true
  return data.new_password !== data.current_password
}, {
  message: 'La nueva contraseña debe ser diferente a la contraseña actual',
  path: ['new_password'],
})

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>
