import { createAdminClient } from '../../../../lib/supabase/admin'
import type { Database, Json } from '../../../../lib/supabase/types'
import { logger } from '../../../../lib/utils/logger'
import {
  BRANDING_THEME_ID,
  generateOrganizationBrandingTheme,
  normalizeOrganizationBrandingColors,
  type OrganizationBrandingRowColors,
} from '@/core/theme/organization-branding-theme'
import { PRESET_THEMES } from '@/features/business-panel/config/preset-themes'
import { AuditLogService } from '../auditLog.service'

import type {
  AdminCompany,
  CompanyCreatePayload,
  CompanyUpdatePayload,
} from '../../types/admin-companies.types'
import {
  DEFAULT_BRAND_ACCENT,
  DEFAULT_BRAND_PRIMARY,
  DEFAULT_BRAND_SECONDARY,
  normalizeBrandHexColor,
} from './admin-company-brand-colors'
import { getAdminCompanyById } from './admin-companies-read.service'

type SupabaseServerClient = ReturnType<typeof createAdminClient>
type OrganizationUpdateData = Database['public']['Tables']['organizations']['Update']
type OrganizationInsertData = Database['public']['Tables']['organizations']['Insert']

function slugifyCompanyName(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function shouldSyncBrandingTheme(updates: CompanyUpdatePayload): boolean {
  return (
    updates.brand_color_primary !== undefined ||
    updates.brand_color_secondary !== undefined ||
    updates.brand_color_accent !== undefined ||
    updates.brand_font_family !== undefined ||
    updates.branding_enabled !== undefined
  )
}

/**
 * Writes the brand color/font columns plus the denormalized *_styles theme.
 *
 * Brand colors are ALWAYS persisted (so a disabled org keeps its palette for
 * later reactivation), but the effective theme depends on `brandingEnabled`:
 * when disabled we write the platform SofLIA preset to every surface
 * (panel + dashboard + login), mirroring the business-panel branding route.
 */
function syncBrandingThemeFields(
  target: OrganizationUpdateData | OrganizationInsertData,
  branding: OrganizationBrandingRowColors,
  brandingEnabled: boolean,
): void {
  const normalizedBranding = normalizeOrganizationBrandingColors(branding)
  const brandingTheme = brandingEnabled
    ? generateOrganizationBrandingTheme(normalizedBranding)
    : PRESET_THEMES['SOFLIA']

  target.brand_color_primary = normalizedBranding.color_primary
  target.brand_color_secondary = normalizedBranding.color_secondary
  target.brand_color_accent = normalizedBranding.color_accent
  target.brand_font_family = normalizedBranding.font_family
  target.branding_enabled = brandingEnabled
  target.panel_styles = brandingTheme.panel as unknown as Json
  target.user_dashboard_styles = brandingTheme.userDashboard as unknown as Json
  target.login_styles = brandingTheme.login as unknown as Json
  target.selected_theme = brandingEnabled ? BRANDING_THEME_ID : 'SOFLIA'
}

function buildUpdateData(
  updates: CompanyUpdatePayload,
  currentBranding?: OrganizationBrandingRowColors | null,
  currentBrandingEnabled?: boolean | null,
): OrganizationUpdateData {
  const updateData: OrganizationUpdateData = {
    updated_at: new Date().toISOString(),
  }

  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.slug !== undefined && updates.slug !== null) updateData.slug = updates.slug
  if (updates.description !== undefined) updateData.description = updates.description
  if (updates.contact_email !== undefined) updateData.contact_email = updates.contact_email
  if (updates.contact_phone !== undefined) updateData.contact_phone = updates.contact_phone
  if (updates.website_url !== undefined) updateData.website_url = updates.website_url
  if (updates.logo_url !== undefined) updateData.logo_url = updates.logo_url
  if (updates.brand_logo_url !== undefined) updateData.brand_logo_url = updates.brand_logo_url
  if (updates.brand_banner_url !== undefined) updateData.brand_banner_url = updates.brand_banner_url
  if (updates.brand_favicon_url !== undefined) updateData.brand_favicon_url = updates.brand_favicon_url
  if (updates.brand_color_primary !== undefined) {
    updateData.brand_color_primary = normalizeBrandHexColor(
      updates.brand_color_primary,
      DEFAULT_BRAND_PRIMARY,
    )
  }
  if (updates.brand_color_secondary !== undefined) {
    updateData.brand_color_secondary = normalizeBrandHexColor(
      updates.brand_color_secondary,
      DEFAULT_BRAND_SECONDARY,
    )
  }
  if (updates.brand_color_accent !== undefined) {
    updateData.brand_color_accent = normalizeBrandHexColor(
      updates.brand_color_accent,
      DEFAULT_BRAND_ACCENT,
    )
  }
  if (updates.brand_font_family !== undefined) updateData.brand_font_family = updates.brand_font_family
  if (updates.is_active !== undefined) updateData.is_active = updates.is_active
  if (updates.subscription_status !== undefined) updateData.subscription_status = updates.subscription_status
  if (updates.subscription_plan !== undefined) updateData.subscription_plan = updates.subscription_plan
  if (updates.max_users !== undefined) updateData.max_users = updates.max_users
  if (updates.google_login_enabled !== undefined) updateData.google_login_enabled = updates.google_login_enabled
  if (updates.microsoft_login_enabled !== undefined) updateData.microsoft_login_enabled = updates.microsoft_login_enabled

  if (shouldSyncBrandingTheme(updates)) {
    const effectiveBrandingEnabled = updates.branding_enabled !== undefined
      ? updates.branding_enabled
      : (currentBrandingEnabled ?? false)

    syncBrandingThemeFields(
      updateData,
      {
        brand_color_primary: updates.brand_color_primary !== undefined
          ? updates.brand_color_primary
          : currentBranding?.brand_color_primary,
        brand_color_secondary: updates.brand_color_secondary !== undefined
          ? updates.brand_color_secondary
          : currentBranding?.brand_color_secondary,
        brand_color_accent: updates.brand_color_accent !== undefined
          ? updates.brand_color_accent
          : currentBranding?.brand_color_accent,
        brand_font_family: updates.brand_font_family !== undefined
          ? updates.brand_font_family
          : currentBranding?.brand_font_family,
      },
      effectiveBrandingEnabled,
    )
  }

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
    .update({ platform_role: 'Business' })
    .eq('id', ownerMembership.user_id)
    .eq('platform_role', 'Usuario')

  if (roleError) {
    logger.error('Error promoting owner platform_role:', roleError)
    return
  }

  logger.info('Owner platform_role promoted to Business', {
    userId: ownerMembership.user_id,
    organizationId,
  })
}

export async function updateAdminCompany(id: string, updates: CompanyUpdatePayload): Promise<AdminCompany> {
  const supabase = createAdminClient()
  let currentBranding: OrganizationBrandingRowColors | null = null
  let currentBrandingEnabled: boolean | null = null

  if (shouldSyncBrandingTheme(updates)) {
    const { data, error } = await supabase
      .from('organizations')
      .select('brand_color_primary, brand_color_secondary, brand_color_accent, brand_font_family, branding_enabled')
      .eq('id', id)
      .single()

    if (error || !data) {
      logger.error('Error fetching current organization branding:', error)
      throw error || new Error('No se pudo obtener el branding actual')
    }

    const { branding_enabled, ...brandingColors } = data as OrganizationBrandingRowColors & {
      branding_enabled: boolean | null
    }
    currentBranding = brandingColors
    currentBrandingEnabled = branding_enabled
  }

  const updateData = buildUpdateData(updates, currentBranding, currentBrandingEnabled)

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
  const supabase = createAdminClient()
  const slug = data.slug || slugifyCompanyName(data.name)

  const { data: existingOrganization } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (existingOrganization) {
    throw new Error('Ya existe una organizacion con este slug')
  }

  const insertData: OrganizationInsertData = {
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
    brand_color_primary: normalizeBrandHexColor(data.brand_color_primary, DEFAULT_BRAND_PRIMARY),
    brand_color_secondary: normalizeBrandHexColor(data.brand_color_secondary, DEFAULT_BRAND_SECONDARY),
    brand_color_accent: normalizeBrandHexColor(data.brand_color_accent, DEFAULT_BRAND_ACCENT),
    brand_font_family: data.brand_font_family || 'Inter',
    branding_enabled: data.branding_enabled ?? false,
    google_login_enabled: data.google_login_enabled ?? false,
    microsoft_login_enabled: data.microsoft_login_enabled ?? false,
  }

  syncBrandingThemeFields(
    insertData,
    {
      brand_color_primary: insertData.brand_color_primary,
      brand_color_secondary: insertData.brand_color_secondary,
      brand_color_accent: insertData.brand_color_accent,
      brand_font_family: insertData.brand_font_family,
    },
    insertData.branding_enabled ?? false,
  )

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

/**
 * Permanently deletes an organization and every org-scoped row that cascades
 * from it (courses assignments, progress, certificates, analytics, hierarchy,
 * chats, notifications, etc — see migration 20260701130000). Member accounts
 * are NOT deleted: `organization_users` cascading only removes the membership
 * row, `users` has no organization_id column, so accounts are just orphaned.
 */
export async function deleteAdminCompany(id: string, adminUserId: string): Promise<void> {
  const supabase = createAdminClient()

  const { data: organization, error: fetchError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !organization) {
    throw new Error('Organizacion no encontrada')
  }

  const { data: ownerMembership } = await supabase
    .from('organization_users')
    .select('user_id')
    .eq('organization_id', id)
    .eq('role', 'owner')
    .maybeSingle()

  await AuditLogService.logAction({
    user_id: ownerMembership?.user_id ?? adminUserId,
    admin_user_id: adminUserId,
    action: 'DELETE',
    table_name: 'organizations',
    record_id: id,
    old_values: organization as unknown as Record<string, unknown>,
  })

  const { error: deleteError } = await supabase.from('organizations').delete().eq('id', id)
  if (deleteError) {
    logger.error('Error deleting organization:', deleteError)
    throw new Error('No se pudo eliminar la organizacion. Verifica que no existan referencias bloqueantes.')
  }
}
