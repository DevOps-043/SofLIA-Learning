import { NextRequest, NextResponse } from 'next/server'

import {
  AdminCompaniesService,
  type CompanyUpdatePayload,
} from '@/features/admin/services/adminCompanies.service'
import {
  DEFAULT_BRAND_ACCENT,
  DEFAULT_BRAND_PRIMARY,
  DEFAULT_BRAND_SECONDARY,
} from '@/features/admin/services/admin-companies/admin-company-brand-colors'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'

import {
  updateCompanySchema,
  type UpdateCompanyBody,
} from '../schema'

type RouteContext = { params: Promise<{ id: string }> }

function buildPayload(body: UpdateCompanyBody): CompanyUpdatePayload {
  const payload: CompanyUpdatePayload = {}
  const assignNullable = <K extends keyof CompanyUpdatePayload>(
    key: K,
    value: CompanyUpdatePayload[K] | string | null | undefined,
  ) => {
    if (value === undefined) return
    payload[key] = value as CompanyUpdatePayload[K]
  }

  if (body.name !== undefined) payload.name = String(body.name)
  if (body.slug !== undefined && body.slug !== null && body.slug !== '') {
    payload.slug = String(body.slug)
  }
  if (body.description !== undefined)
    payload.description = body.description ? String(body.description) : null
  if (body.contact_email !== undefined)
    payload.contact_email = body.contact_email ? String(body.contact_email) : null
  if (body.contact_phone !== undefined)
    payload.contact_phone = body.contact_phone ? String(body.contact_phone) : null
  if (body.website_url !== undefined)
    payload.website_url = body.website_url ? String(body.website_url) : null

  assignNullable('logo_url', body.logo_url ? String(body.logo_url) : body.logo_url === '' ? null : body.logo_url ?? undefined)
  if (body.brand_logo_url !== undefined)
    payload.brand_logo_url = body.brand_logo_url ? String(body.brand_logo_url) : null
  if (body.brand_banner_url !== undefined)
    payload.brand_banner_url = body.brand_banner_url ? String(body.brand_banner_url) : null
  if (body.brand_favicon_url !== undefined)
    payload.brand_favicon_url = body.brand_favicon_url ? String(body.brand_favicon_url) : null
  if (body.brand_color_primary !== undefined)
    payload.brand_color_primary = body.brand_color_primary
      ? String(body.brand_color_primary)
      : DEFAULT_BRAND_PRIMARY
  if (body.brand_color_secondary !== undefined)
    payload.brand_color_secondary = body.brand_color_secondary
      ? String(body.brand_color_secondary)
      : DEFAULT_BRAND_SECONDARY
  if (body.brand_color_accent !== undefined)
    payload.brand_color_accent = body.brand_color_accent
      ? String(body.brand_color_accent)
      : DEFAULT_BRAND_ACCENT
  if (body.brand_font_family !== undefined)
    payload.brand_font_family = body.brand_font_family ?? 'Inter'

  if (body.is_active !== undefined) payload.is_active = Boolean(body.is_active)
  if (body.subscription_status !== undefined)
    payload.subscription_status = String(body.subscription_status)
  if (body.subscription_plan !== undefined)
    payload.subscription_plan = String(body.subscription_plan)
  if (body.google_login_enabled !== undefined)
    payload.google_login_enabled = Boolean(body.google_login_enabled)
  if (body.microsoft_login_enabled !== undefined)
    payload.microsoft_login_enabled = Boolean(body.microsoft_login_enabled)
  if (body.max_users !== undefined && body.max_users >= 1) {
    payload.max_users = body.max_users
  }
  return payload
}

async function handlePut(
  _request: NextRequest,
  body: UpdateCompanyBody,
  context: RouteContext,
) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const { id: companyId } = await context.params
  if (!companyId) {
    return apiError('COMPANY_ID_INVALID', 'ID de empresa inválido', 400)
  }

  const payload = buildPayload(body)
  if (Object.keys(payload).length === 0) {
    return apiError('NO_CHANGES', 'No se enviaron cambios', 400)
  }

  try {
    const company = await AdminCompaniesService.updateCompany(companyId, payload)
    return NextResponse.json({ success: true, company })
  } catch (error) {
    logger.error(`Error updating company ${companyId}`, error)
    return apiError('UPDATE_COMPANY_FAILED', 'Error al actualizar la empresa', 500)
  }
}

export const PUT = withZodBody(updateCompanySchema, handlePut)
