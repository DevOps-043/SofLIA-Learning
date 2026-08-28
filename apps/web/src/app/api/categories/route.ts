import { NextRequest, NextResponse } from 'next/server'
import { CourseService } from '../../../features/courses/services/course.service'
import { formatApiError, logError } from '@/core/utils/api-errors'

export async function GET(request: NextRequest) {
  try {
    const categories = await CourseService.getCategories()

    // ⚡ Cache 5min - categorías raramente cambian
    const { withCache, staticCache } = await import('@/core/utils/cache-headers')
    return withCache(
      NextResponse.json(categories),
      staticCache
    )
  } catch (error) {
    logError('GET /api/categories', error)
    return NextResponse.json(
      { error: 'Error al obtener categorías' },
      { status: 500 }
    )
  }
}
