import { z } from 'zod';
import {
  DateOfBirthSchema,
  UserGenderSchema,
} from './user-demographics.schema';

/**
 * Schema para crear usuario
 */
export const CreateUserSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .max(255, 'El email no puede exceder 255 caracteres')
    .trim()
    .toLowerCase(),
  
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  display_name: z.string().optional().nullable(),
  
  username: z.string()
    .min(3, 'El username debe tener al menos 3 caracteres')
    .max(30, 'El username no puede exceder 30 caracteres')
    .regex(/^[a-zA-Z0-9_-]+$/, 'El username solo puede contener letras, números, guiones y guiones bajos')
    .trim(),
  
  password: z.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(100, 'La contraseña no puede exceder 100 caracteres'),
  
  cargo_rol: z.enum(['Usuario', 'Instructor', 'Administrador', 'Business', 'Business User'], {
    errorMap: () => ({ message: 'Rol inválido. Debe ser: Usuario, Instructor, Administrador, Business o Business User' })
  }).default('Usuario'),
  
  type_rol: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  country_code: z.string().optional().nullable(),
  date_of_birth: DateOfBirthSchema.optional(),
  gender: UserGenderSchema.optional(),
  
  bio: z.string()
    .max(500, 'La biografía no puede exceder 500 caracteres')
    .optional()
    .nullable(),
  
  profile_picture_url: z.string()
    .max(500, 'La URL del avatar no puede exceder 500 caracteres')
    .optional()
    .nullable()
    .or(z.literal('')),
});

/**
 * Schema para actualizar usuario
 */
export const UpdateUserSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .max(255, 'El email no puede exceder 255 caracteres')
    .trim()
    .toLowerCase()
    .optional(),
  
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  display_name: z.string().optional().nullable(),
  
  username: z.string()
    .min(3, 'El username debe tener al menos 3 caracteres')
    .max(30, 'El username no puede exceder 30 caracteres')
    .regex(/^[a-zA-Z0-9_-]+$/, 'El username solo puede contener letras, números, guiones y guiones bajos')
    .trim()
    .optional(),
  
  cargo_rol: z.enum(['Usuario', 'Instructor', 'Administrador', 'Business', 'Business User'], {
    errorMap: () => ({ message: 'Rol inválido. Debe ser: Usuario, Instructor, Administrador, Business o Business User' })
  }).optional(),
  
  type_rol: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  country_code: z.string().optional().nullable(),
  date_of_birth: DateOfBirthSchema.optional(),
  gender: UserGenderSchema.optional(),
  email_verified: z.boolean().optional(),
  
  bio: z.string()
    .max(500, 'La biografía no puede exceder 500 caracteres')
    .optional()
    .nullable(),
  
  profile_picture_url: z.string()
    .max(500, 'La URL del avatar no puede exceder 500 caracteres')
    .optional()
    .nullable()
    .or(z.literal('')),
  
  is_active: z.boolean()
    .optional(),
});

/**
 * Schema para cambiar contraseña
 */
export const ChangePasswordSchema = z.object({
  current_password: z.string()
    .min(1, 'La contraseña actual es requerida'),
  
  new_password: z.string()
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
    .max(100, 'La nueva contraseña no puede exceder 100 caracteres')
    .regex(/[A-Z]/, 'La nueva contraseña debe contener al menos una letra mayúscula')
    .regex(/[a-z]/, 'La nueva contraseña debe contener al menos una letra minúscula')
    .regex(/[0-9]/, 'La nueva contraseña debe contener al menos un número'),
  
  confirm_password: z.string()
    .min(1, 'Debe confirmar la nueva contraseña'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm_password'],
}).refine((data) => {
  // Solo validar si ambos campos tienen valores
  if (!data.current_password || !data.new_password) return true;
  return data.new_password !== data.current_password;
}, {
  message: 'La nueva contraseña debe ser diferente a la contraseña actual',
  path: ['new_password'],
});

/**
 * Tipos TypeScript inferidos
 */
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
