import { z } from 'zod'

export const UserEmailSchema = z.string()
  .email('Email inválido')
  .max(255, 'El email no puede exceder 255 caracteres')
  .trim()
  .toLowerCase()

export const UserNameSchema = z.string()
  .min(3, 'El username debe tener al menos 3 caracteres')
  .max(30, 'El username no puede exceder 30 caracteres')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'El username solo puede contener letras, números, guiones y guiones bajos',
  )
  .trim()

export const UserRoleEnumSchema = z.enum(
  ['Usuario', 'Instructor', 'Administrador', 'Business', 'Business User'],
  {
    errorMap: () => ({
      message:
        'Rol inválido. Debe ser: Usuario, Instructor, Administrador, Business o Business User',
    }),
  },
)

export const UserBioSchema = z.string()
  .max(500, 'La biografía no puede exceder 500 caracteres')
  .optional()
  .nullable()

export const UserProfilePictureUrlSchema = z.string()
  .max(500, 'La URL del avatar no puede exceder 500 caracteres')
  .optional()
  .nullable()
  .or(z.literal(''))
