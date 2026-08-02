import { z } from 'zod'
import { AdminCompaniesService } from '@/features/admin/services/adminCompanies.service'
import { resolveTargetOrganization } from '../entity-resolution'
import { defineAction } from '../types'

/**
 * Acciones sobre organizaciones. Delegan en `AdminCompaniesService`, el mismo
 * servicio que usan las rutas `/api/admin/companies`: SofLIA no reimplementa
 * la lógica de negocio ni escribe en las tablas directamente.
 */

const createOrganizationSchema = z.object({
  name: z.string().min(1).max(200),
  contactEmail: z.string().email().max(320).optional(),
  ownerEmail: z.string().email().max(320).optional(),
  maxUsers: z.number().int().min(1).max(1_000_000).optional(),
  brandingEnabled: z.boolean().optional(),
})

type CreateOrganizationParams = z.infer<typeof createOrganizationSchema>

export const createOrganizationAction = defineAction<CreateOrganizationParams>({
  id: 'create_organization',
  risk: 'create',
  description:
    'Crea una nueva organización (empresa cliente) en la plataforma. Opcionalmente asigna un email de contacto, un email de propietario y un límite de usuarios.',
  paramsExample: {
    name: 'Acme Corp',
    contactEmail: 'contacto@acme.com',
    ownerEmail: 'director@acme.com',
    maxUsers: 100,
    brandingEnabled: true,
  },
  schema: createOrganizationSchema,

  async preview(params) {
    const details = [
      `nombre: "${params.name}"`,
      params.contactEmail ? `email de contacto: ${params.contactEmail}` : null,
      params.ownerEmail ? `propietario: ${params.ownerEmail}` : null,
      params.maxUsers ? `límite de usuarios: ${params.maxUsers}` : null,
      params.brandingEnabled ? 'branding personalizado: activado' : null,
    ]
      .filter(Boolean)
      .join(', ')

    return { summary: `Crear la organización con ${details}.` }
  },

  async execute(params) {
    const company = await AdminCompaniesService.createCompany({
      name: params.name,
      contact_email: params.contactEmail,
      owner_email: params.ownerEmail,
      max_users: params.maxUsers,
      branding_enabled: params.brandingEnabled,
    })

    return {
      summary: `Organización "${company.name}" creada correctamente.`,
      details: {
        organizationId: company.id,
        slug: company.slug ?? null,
      },
      navigateTo: `/admin/companies/${company.id}/edit`,
    }
  },
})

const setBrandingSchema = z.object({
  organization: z.string().min(1).max(200),
  enabled: z.boolean(),
})

type SetBrandingParams = z.infer<typeof setBrandingSchema>

export const setOrganizationBrandingAction = defineAction<SetBrandingParams>({
  id: 'set_organization_branding',
  risk: 'configure',
  description:
    'Activa o desactiva el modo de branding personalizado (pestaña Branding del panel de la organización). Identifica la organización por nombre, slug o ID.',
  paramsExample: { organization: 'acme', enabled: true },
  schema: setBrandingSchema,

  async preview(params) {
    const organization = await resolveTargetOrganization(params.organization)
    const alreadyInState = organization.brandingEnabled === params.enabled

    return {
      summary: `${params.enabled ? 'Activar' : 'Desactivar'} el branding personalizado de la organización "${organization.name}".`,
      warnings: alreadyInState
        ? [
            `El branding de "${organization.name}" ya está ${params.enabled ? 'activado' : 'desactivado'}; la acción no cambiaría nada.`,
          ]
        : undefined,
    }
  },

  async execute(params) {
    const organization = await resolveTargetOrganization(params.organization)

    await AdminCompaniesService.updateCompany(organization.id, {
      branding_enabled: params.enabled,
    })

    return {
      summary: `Branding personalizado ${params.enabled ? 'activado' : 'desactivado'} para "${organization.name}".`,
      details: { organizationId: organization.id, brandingEnabled: params.enabled },
      navigateTo: `/admin/companies/${organization.id}/edit?tab=customization`,
    }
  },
})
