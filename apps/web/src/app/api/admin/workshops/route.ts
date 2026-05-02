import { NextResponse } from 'next/server'

import { AdminWorkshopsService } from '@/features/admin/services/adminWorkshops.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 24
const MAX_LIMIT = 48

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const page = parsePositiveInteger(searchParams.get('page'), DEFAULT_PAGE)
    const requestedLimit = parsePositiveInteger(searchParams.get('limit'), DEFAULT_LIMIT)
    const limit = Math.min(requestedLimit, MAX_LIMIT)
    const statusParam = searchParams.get('status')
    const status = statusParam === 'active' || statusParam === 'inactive' ? statusParam : undefined

    const result = await AdminWorkshopsService.getWorkshopsPage({
      page,
      limit,
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      status,
    })

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    logger.error('Error fetching admin workshops:', error)
    return NextResponse.json({ message: 'Error fetching admin workshops' }, { status: 500 })
  }
}
