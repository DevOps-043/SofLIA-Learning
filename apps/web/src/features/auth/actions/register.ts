'use server'

import { createClient } from '../../../lib/supabase/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import crypto from 'crypto'
import {
  validateInvitationAction,
  findInvitationByEmailAction,
  consumeInvitationAction
} from './invitation'
import { createInvitationRepository } from './invitation/repository'
import { finalizeBulkInviteRegistration } from './invitation/invitation-redemption.service'
import { validateBulkInviteRegistration } from './invitation/invitation-validation.service'
import {
  RegisterDemographicsSchema,
  normalizeDateOfBirthForStorage,
  normalizeGenderForStorage,
} from '../../../lib/schemas/user-demographics.schema'

const registerSchema = z.object({
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres')
    .max(20, 'El usuario no puede tener más de 20 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'El usuario solo puede contener letras, números y guiones bajos'),
  email: z.string().email('Email inválido'),
  confirmEmail: z.string().email('Email de confirmación inválido'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  confirmPassword: z.string().min(1, 'Confirma la contraseña'),
  countryCode: z.string().min(1, 'Selecciona un país'),
  phoneNumber: z.string().min(1, 'El teléfono es requerido'),
  dateOfBirth: RegisterDemographicsSchema.shape.dateOfBirth,
  gender: RegisterDemographicsSchema.shape.gender,
  cargo_titulo: z.string().max(100, 'El cargo no puede exceder 100 caracteres').optional(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'Debes aceptar los términos y condiciones',
  }),
}).refine(data => data.email === data.confirmEmail, {
  message: 'Los emails no coinciden',
  path: ['confirmEmail'],
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

export async function registerAction(formData: FormData) {
  try {
    // Convertir FormData a objeto, manejando correctamente los tipos
    const rawData = Object.fromEntries(formData)

    // Convertir aceptTerms de string a boolean
    const formDataParsed = {
      ...rawData,
      acceptTerms: rawData.acceptTerms === 'true' || rawData.acceptTerms === 'on'
    }

    const parsed = registerSchema.parse(formDataParsed)

    // Obtener contexto de organización si viene de registro personalizado
    const organizationId = formData.get('organizationId')?.toString()
    const organizationSlug = formData.get('organizationSlug')?.toString()
    const invitationToken = formData.get('invitationToken')?.toString()
    const bulkInviteToken = formData.get('bulkInviteToken')?.toString()

    const supabase = await createClient()
    const invitationRepository = createInvitationRepository(supabase)

    // Variables para almacenar datos de la invitación (si existe)
    let invitedRole: string | undefined
    let invitedPosition: string | undefined

    // Validar organización si viene de registro personalizado
    if (organizationId && organizationSlug) {
      const currentOrganizationId = organizationId
      const currentOrganizationSlug = organizationSlug

      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .select('id, slug, subscription_plan, subscription_status, is_active')
        .eq('id', currentOrganizationId)
        .eq('slug', currentOrganizationSlug)
        .single()

      if (orgError || !organization) {
        return { error: 'Organización no encontrada' }
      }

      // Validar que puede usar login personalizado
      const allowedPlans = ['team', 'business', 'enterprise']
      const activeStatuses = ['active', 'trial']

      const subscriptionPlan = organization.subscription_plan ?? ''
      const subscriptionStatus = organization.subscription_status ?? ''

      if (!allowedPlans.includes(subscriptionPlan) ||
        !activeStatuses.includes(subscriptionStatus) ||
        !organization.is_active) {
        return { error: 'Esta organización no permite nuevos registros' }
      }

      // ============================================================================
      // VALIDACIÓN DE INVITACIÓN (NUEVO)
      // ============================================================================

      if (bulkInviteToken) {
        // Caso 0: Registro con enlace de invitación masiva
        const bulkInviteValidation = await validateBulkInviteRegistration(
          invitationRepository,
          bulkInviteToken,
          currentOrganizationId
        )

        if (!bulkInviteValidation.valid) {
          return {
            error:
              bulkInviteValidation.error ||
              'Enlace de invitacion invalido o expirado',
          }
        }

        invitedRole = bulkInviteValidation.role
      } else if (invitationToken) {
        // Caso 1: Registro con token de invitación individual
        const validation = await validateInvitationAction(invitationToken)

        if (!validation.valid) {
          return { error: validation.error || 'Invitación inválida o expirada' }
        }

        // Verificar que el email coincide con la invitación
        if (validation.email?.toLowerCase() !== parsed.email.toLowerCase()) {
          return { error: 'El email no coincide con la invitación' }
        }

        // Verificar que la invitación es para esta organización
        if (validation.organizationId !== currentOrganizationId) {
          return { error: 'Esta invitación no es para esta organización' }
        }

        // Guardar rol y posición de la invitación
        invitedRole = validation.role
        invitedPosition = validation.position
      } else {
        // Caso 2: Registro manual sin token - buscar invitación por email
        const { hasInvitation, role, error: invError } = await findInvitationByEmailAction(
          parsed.email,
          currentOrganizationId
        )

        if (!hasInvitation) {
          return {
            error: invError || 'Tu correo no ha sido invitado a esta organización. Contacta al administrador para solicitar una invitación.'
          }
        }

        // Guardar rol de la invitación
        invitedRole = role
      }
    }

    // Verificar usuario/email no exista en nuestra tabla (como antes)
    const { data: existing } = await supabase
      .from('users')
      .select('id, username, email')
      .or(`username.eq.${parsed.username},email.eq.${parsed.email}`)

    if (existing && existing.length > 0) {
      const conflict = existing.find(u => u.username === parsed.username)
        ? 'usuario'
        : 'email'
      return { error: `El ${conflict} ya existe` }
    }

    // Hash password (como en tu sistema anterior)
    const passwordHash = await bcrypt.hash(parsed.password, 12)

    // GENERAR ID único para el usuario (como en tu sistema anterior)
    const userId = crypto.randomUUID()

    // Crear usuario directamente en la tabla users (sin Supabase Auth)
    // PRIORIDAD: 1. Posición de la invitación, 2. Dato del formulario, 3. 'Usuario'
    const cargoTitulo = invitedPosition || parsed.cargo_titulo?.trim() || 'Usuario';

    // Determinar cargo_rol basado en el contexto de registro
    // Después de la migración, solo existen: Usuario, Instructor, Administrador, Business
    let cargoRol = 'Usuario' // Valor por defecto para registro público
    
    if (organizationId && invitedRole) {
      // Si viene de una organización, siempre es 'Business'
      // La diferenciación (owner/admin/member) se hace en organization_users.role
      cargoRol = 'Business'
    }

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        id: userId, // ID generado por nosotros
        username: parsed.username,
        email: parsed.email,
        password_hash: passwordHash,
        first_name: parsed.firstName,
        last_name: parsed.lastName,
        display_name: `${parsed.firstName} ${parsed.lastName}`.trim(), // Generar display_name
        country_code: parsed.countryCode,
        phone: parsed.phoneNumber, // Campo phone para el número de teléfono (varchar en DB)
        date_of_birth: normalizeDateOfBirthForStorage(parsed.dateOfBirth),
        gender: normalizeGenderForStorage(parsed.gender),
        cargo_rol: cargoRol, // Rol basado en la invitación (ya no incluye 'Business User')
        // NOTA: type_rol fue eliminado - ahora el cargo/posición va en organization_users.job_title
        email_verified: false, // Se verificará después con email manual
      })
      .select()
      .single()

    if (error) {
      console.error('❌ [registerAction] Error creating user profile:', error)
      // Limpiar cuenta de auth en caso de error
      // Nota: Esto requeriría service role key, por ahora solo logueamos
      return { error: 'Error al crear perfil de usuario' }
    }


    // Si viene de registro personalizado de organización, crear relación en organization_users
    if (organizationId) {
      try {

        const { error: orgUserError } = await supabase
          .from('organization_users')
          .insert({
            organization_id: organizationId,
            user_id: user.id,
            role: invitedRole || 'member', // Usar rol de la invitación si existe
            status: 'active',
            joined_at: new Date().toISOString(),
            job_title: cargoTitulo // Cargo/posición del usuario en esta organización
          })

        if (orgUserError) {
           console.error('❌ [registerAction] Error creating organization_users relation:', orgUserError)
           // Hacemos throw para que vaya al catch, pero no bloqueamos el registro exitoso del usuario
           throw orgUserError; 
        } else {
        }

        // Consumir la invitación según el tipo
        if (bulkInviteToken) {
          const bulkConsumeResult = await finalizeBulkInviteRegistration(
            invitationRepository,
            bulkInviteToken,
            organizationId,
            user.id
          )

          if (!bulkConsumeResult.success) {
            throw new Error(
              bulkConsumeResult.error ||
                'Error al finalizar la invitacion masiva'
            )
          }
        } else {
          // Consumir invitación individual
          await consumeInvitationAction(
            invitationToken || parsed.email,
            organizationId,
            user.id
          )
        }
      } catch (orgUserError) {
        // No fallar el registro si hay error creando la relación
        console.error('⚠️ [registerAction] Error no crítico vinculando a organización:', orgUserError)
      }
    }

    // Si se proporcionó cargo_titulo, crear perfil inicial en user_perfil
    if (parsed.cargo_titulo && parsed.cargo_titulo.trim()) {
      try {
        await supabase
          .from('user_perfil')
          .insert({
            user_id: user.id,
            cargo_titulo: parsed.cargo_titulo.trim(),
            creado_en: new Date().toISOString(),
            actualizado_en: new Date().toISOString()
          })
      } catch (profileError) {
        // No fallar el registro si hay error creando el perfil
        // El perfil se puede crear después cuando complete el cuestionario
      }
    }

    return {
      success: true,
      message: 'Cuenta creada exitosamente.',
      userId: user.id
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    return { error: 'Error inesperado' }
  }
}
