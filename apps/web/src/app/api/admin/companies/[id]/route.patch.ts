import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth/requireAdmin'

import { logger } from '@/lib/utils/logger'

import { AdminCompaniesService, CompanyUpdatePayload } from '@/features/admin/services/adminCompanies.service'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// PATCH - Actualización parcial (retrocompatibilidad)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return PUT(request, { params })
}
