import { createClient } from '../../../../lib/supabase/server'
import { logger } from '../../../../lib/utils/logger'

import type {
  AdminCompany,
  CompanyCreatePayload,
  CompanyUpdatePayload,
} from '../../types/admin-companies.types'
import { getAdminCompanyById } from './admin-companies-read.service'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

function slugifyCompanyName(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function buildUpdateData(updates: CompanyUpdatePayload): Record<string, unknown> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.slug !== undefined) updateData.slug = updates.slug
  if (updates.description !== undefined) updateData.description = updates.description
  if (updates.contact_email !== undefined) updateData.contact_email = updates.contact_email
  if (updates.contact_phone !== undefined) updateData.contact_phone = updates.contact_phone
  if (updates.website_url !== undefined) updateData.website_url = updates.website_url
  if (updates.logo_url !== undefined) updateData.logo_url = updates.logo_url
  if (updates.brand_logo_url !== undefined) updateData.brand_logo_url = updates.brand_logo_url
  if (updates.brand_banner_url !== undefined) updateData.brand_banner_url = updates.brand_banner_url
  if (updates.brand_favicon_url !== undefined) updateData.brand_favicon_url = updates.brand_favicon_url
  if (updates.brand_color_primary !== undefined) updateData.brand_color_primary = updates.brand_color_primary
  if (updates.brand_color_secondary !== undefined) updateData.brand_color_secondary = updates.brand_color_secondary
  if (updates.brand_color_accent !== undefined) updateData.brand_color_accent = updates.brand_color_accent
  if (updates.brand_font_family !== undefined) updateData.brand_font_family = updates.brand_font_family
  if (updates.is_active !== undefined) updateData.is_active = updates.is_active
  if (updates.subscription_status !== undefined) updateData.subscription_status = updates.subscription_status
  if (updates.subscription_plan !== undefined) updateData.subscription_plan = updates.subscription_plan
  if (updates.max_users !== undefined) updateData.max_users = updates.max_users
  if (updates.google_login_enabled !== undefined) updateData.google_login_enabled = updates.google_login_enabled
  if (updates.microsoft_login_enabled !== undefined) updateData.microsoft_login_enabled = updates.microsoft_login_enabled

  if (Object.keys(updateData).length === 1) {
    throw new Error('No hay campos para actualizar')
  }

  return updateData
}

async function promotePendingOwnerIfNeeded(
  supabase: SupabaseServerClient,
  organizationId: string
): Promise<void> {
  const { data: ownerMembership } = await supabase
    .from('organization_users')
    .select('user_id')
    .eq('organization_id', organizationId)
    .eq('role', 'owner')
    .maybeSingle()

  if (!ownerMembership) {
    return
  }

  const { error: roleError } = await supabase
    .from('users')
    .update({ cargo_rol: 'Business' })
    .eq('id', ownerMembership.user_id)
    .eq('cargo_rol', 'Usuario')

  if (roleError) {
    logger.error('Error promoting owner cargo_rol:', roleError)
    return
  }

  logger.info('Owner cargo_rol promoted to Business', {
    userId: ownerMembership.user_id,
    organizationId,
  })
}

export async function updateAdminCompany(id: string, updates: CompanyUpdatePayload): Promise<AdminCompany> {
  const supabase = await createClient()
  const updateData = buildUpdateData(updates)

  let shouldPromotePendingOwner = false
  if (updates.is_active === true) {
    const { data: currentOrganization } = await supabase
      .from('organizations')
      .select('is_active, subscription_status')
      .eq('id', id)
      .single()

    if (currentOrganization && !currentOrganization.is_active && currentOrganization.subscription_status === 'pending') {
      shouldPromotePendingOwner = true
      if (!updates.subscription_status) {
        updateData.subscription_status = 'active'
      }
    }
  }

  const { error } = await supabase.from('organizations').update(updateData).eq('id', id)
  if (error) {
    logger.error('Error updating organization:', error)
    throw error
  }

  if (shouldPromotePendingOwner) {
    await promotePendingOwnerIfNeeded(supabase, id)
  }

  const updatedCompany = await getAdminCompanyById(id)
  if (!updatedCompany) {
    throw new Error('Organizacion no encontrada despues de actualizar')
  }

  return updatedCompany
}

export async function createAdminCompany(data: CompanyCreatePayload): Promise<AdminCompany> {
  const supabase = await createClient()
  const slug = data.slug || slugifyCompanyName(data.name)

  const { data: existingOrganization } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (existingOrganization) {
    throw new Error('Ya existe una organizacion con este slug')
  }

  const insertData = {
    name: data.name,
    slug,
    description: data.description || null,
    contact_email: data.contact_email || null,
    contact_phone: data.contact_phone || null,
    website_url: data.website_url || null,
    subscription_plan: data.subscription_plan || 'team',
    subscription_status: data.subscription_status || 'active',
    max_users: data.max_users || 10,
    is_active: data.is_active !== false,
    brand_logo_url: data.brand_logo_url || null,
    brand_banner_url: data.brand_banner_url || null,
    brand_favicon_url: data.brand_favicon_url || null,
    brand_color_primary: data.brand_color_primary || 'var(--color-info)',
    brand_color_secondary: data.brand_color_secondary || 'var(--color-success)',
    brand_color_accent: data.brand_color_accent || 'var(--color-secondary)',
    brand_font_family: data.brand_font_family || 'Inter',
    google_login_enabled: data.google_login_enabled ?? false,
    microsoft_login_enabled: data.microsoft_login_enabled ?? false,
  }

  const { data: createdOrganization, error } = await supabase
    .from('organizations')
    .insert(insertData)
    .select('id')
    .single()

  if (error) {
    logger.error('Error creating organization:', error)
    throw error
  }

  if (data.owner_email) {
    try {
      const { inviteUserAction } = await import('../../../../features/auth/actions/invitation')
      await inviteUserAction({
        email: data.owner_email,
        role: 'owner',
        organizationId: createdOrganization.id,
        position: data.owner_position || undefined,
      })
      logger.info('Owner invitation sent:', {
        email: data.owner_email,
        organizationId: createdOrganization.id,
      })
    } catch (inviteError) {
      logger.error('Error inviting owner after company creation:', inviteError)
    }
  }

  const createdCompany = await getAdminCompanyById(createdOrganization.id)
  if (!createdCompany) {
    throw new Error('Error al obtener la organizacion creada')
  }

  return createdCompany
}
