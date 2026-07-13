import { nanoid } from 'nanoid'
import { z } from 'zod'
import { CourseDefaultsService } from '@/features/courses/services/course-defaults.server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { resolveTargetCourse, resolveTargetOrganization } from '../entity-resolution'
import { defineAction } from '../types'

/**
 * Acciones de asignación: cursos por defecto de una organización y enlaces de
 * invitación masiva. Los cursos por defecto delegan en `CourseDefaultsService`
 * (mismo servicio que `/api/admin/companies/[id]/course-defaults`).
 */

const addDefaultCourseSchema = z.object({
  organization: z.string().min(1).max(200),
  course: z.string().min(1).max(200),
  applyNow: z.boolean().default(true),
})

type AddDefaultCourseParams = z.infer<typeof addDefaultCourseSchema>

export const addDefaultCourseAction = defineAction<AddDefaultCourseParams>({
  id: 'add_default_course',
  risk: 'configure',
  description:
    'Marca un curso como predeterminado de una organización: se asigna automáticamente a sus usuarios. Con applyNow=true se aplica de inmediato a los usuarios existentes.',
  paramsExample: {
    organization: 'acme',
    course: 'Fundamentos de IA',
    applyNow: true,
  },
  schema: addDefaultCourseSchema,

  async preview(params) {
    const [organization, course] = await Promise.all([
      resolveTargetOrganization(params.organization),
      resolveTargetCourse(params.course),
    ])

    return {
      summary: `Marcar el curso "${course.title}" como predeterminado de la organización "${organization.name}".`,
      warnings: params.applyNow
        ? [
            'Se aplicará de inmediato: todos los usuarios actuales de la organización quedarán inscritos en el curso.',
          ]
        : undefined,
    }
  },

  async execute(params, context) {
    const [organization, course] = await Promise.all([
      resolveTargetOrganization(params.organization),
      resolveTargetCourse(params.course),
    ])

    const ruleId = await CourseDefaultsService.createOrReactivateDefaultRule({
      organizationId: organization.id,
      courseId: course.id,
      scopeType: 'organization',
      nodeId: null,
      includeDescendants: true,
      createdBy: context.adminUserId,
    })

    if (params.applyNow) {
      await CourseDefaultsService.applyDefaultRules({
        organizationId: organization.id,
        ruleIds: [ruleId],
        appliedBy: context.adminUserId,
      })
    }

    return {
      summary: `El curso "${course.title}" quedó como predeterminado de "${organization.name}"${params.applyNow ? ' y se aplicó a los usuarios existentes' : ''}.`,
      details: { ruleId, organizationId: organization.id, courseId: course.id },
    }
  },
})

const createInviteLinkSchema = z.object({
  organization: z.string().min(1).max(200),
  maxUses: z.number().int().min(1).max(10_000),
  role: z.enum(['member', 'admin', 'owner']).default('member'),
  expiresInDays: z.number().int().min(1).max(365).default(30),
  name: z.string().min(1).max(120).optional(),
})

type CreateInviteLinkParams = z.infer<typeof createInviteLinkSchema>

interface BulkInviteLinkInsertRow {
  organization_id: string
  created_by: string
  token: string
  name: string | null
  max_uses: number
  role: string
  expires_at: string
  status: string
}

export const createInviteLinkAction = defineAction<CreateInviteLinkParams>({
  id: 'create_invite_link',
  risk: 'sensitive',
  description:
    'Genera un enlace de invitación masiva para que usuarios se unan a una organización, con número máximo de usos, rol asignado y caducidad.',
  paramsExample: {
    organization: 'acme',
    maxUses: 50,
    role: 'member',
    expiresInDays: 30,
    name: 'Onboarding Q3',
  },
  schema: createInviteLinkSchema,

  async preview(params) {
    const organization = await resolveTargetOrganization(params.organization)

    const warnings = [
      `Cualquiera con el enlace podrá unirse a "${organization.name}" como "${params.role}" hasta ${params.maxUses} veces.`,
    ]
    if (params.role !== 'member') {
      warnings.push(
        `ATENCIÓN: el rol "${params.role}" otorga permisos de administración sobre la organización.`,
      )
    }

    return {
      summary: `Crear un enlace de invitación a "${organization.name}" con rol "${params.role}", ${params.maxUses} usos máximos y caducidad de ${params.expiresInDays} días.`,
      warnings,
    }
  },

  async execute(params, context) {
    const organization = await resolveTargetOrganization(params.organization)

    const expiresAt = new Date(
      Date.now() + params.expiresInDays * 24 * 60 * 60 * 1000,
    ).toISOString()
    const token = nanoid(32)

    const supabase = createAdminClient()
    const { error } = await fromLoose<BulkInviteLinkInsertRow, BulkInviteLinkInsertRow>(
      supabase,
      'bulk_invite_links',
    ).insert({
      organization_id: organization.id,
      created_by: context.adminUserId,
      token,
      name: params.name ?? null,
      max_uses: params.maxUses,
      role: params.role,
      expires_at: expiresAt,
      status: 'active',
    })

    if (error) {
      throw new Error(`No se pudo crear el enlace de invitación: ${error.message}`)
    }

    return {
      summary: `Enlace de invitación creado para "${organization.name}" (${params.maxUses} usos, rol ${params.role}).`,
      details: {
        inviteToken: token,
        organizationId: organization.id,
        expiresAt,
      },
    }
  },
})
