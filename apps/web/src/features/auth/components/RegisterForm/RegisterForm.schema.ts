import { z } from 'zod';
import { RegisterDemographicsSchema } from '../../../../lib/schemas/user-demographics.schema';

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(50, 'El nombre no puede exceder 50 caracteres')
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo se permiten letras'),
    lastName: z
      .string()
      .min(2, 'El apellido debe tener al menos 2 caracteres')
      .max(50, 'El apellido no puede exceder 50 caracteres')
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo se permiten letras'),
    username: z
      .string()
      .min(3, 'El usuario debe tener al menos 3 caracteres')
      .max(20, 'El usuario no puede exceder 20 caracteres')
      .regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guión bajo'),
    countryCode: z.string().min(1, 'Selecciona un país'),
    phoneNumber: z
      .string()
      .min(8, 'El número debe tener al menos 8 dígitos')
      .max(15, 'El número no puede exceder 15 dígitos')
      .regex(/^[0-9]+$/, 'Solo se permiten números'),
    dateOfBirth: RegisterDemographicsSchema.shape.dateOfBirth,
    gender: RegisterDemographicsSchema.shape.gender,
    email: z.string().email('Ingresa un correo válido'),
    confirmEmail: z.string().email('Ingresa un correo válido'),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[a-z]/, 'Debe contener al menos una minúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número')
      .regex(/[^a-zA-Z0-9]/, 'Debe contener al menos un carácter especial'),
    confirmPassword: z.string(),
    cargo_titulo: z
      .string()
      .max(100, 'El cargo no puede exceder 100 caracteres')
      .optional(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'Debes aceptar los términos y condiciones',
    }),
  })
  .refine((data) => data.email === data.confirmEmail, {
    message: 'Los correos no coinciden',
    path: ['confirmEmail'],
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });
