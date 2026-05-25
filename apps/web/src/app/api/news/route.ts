import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'
import { formatApiError, logError } from '@/core/utils/api-errors'

export const revalidate = 300

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'published'
    const language = searchParams.get('language')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = await createClient()
    
    // ⚡ SELECT específico en lugar de '*' para reducir payload
    let query = supabase
      .from('news')
      .select('id, title, slug, excerpt, content, featured_image_url, author_id, published_at, status, language, metrics, created_at, updated_at')
      .eq('status', status)
      .order('published_at', { ascending: false })

    if (language && language !== 'all') {
      query = query.eq('language', language)
    }

    if (limit) {
      query = query.limit(limit)
    }

    if (offset) {
      query = query.range(offset, offset + limit - 1)
    }

    const { data, error } = await query

    if (error) {
      logError('GET /api/news - database query', error)
      return NextResponse.json(
        formatApiError(error, 'Error al obtener noticias'),
        { status: 500 }
      )
    }

    // Procesar métricas si están disponibles
    const newsWithMetrics = data.map(news => ({
      ...news,
      view_count: news.metrics?.views || 0,
      comment_count: news.metrics?.comments || 0
    }))

    // Importar utilidades de cache
    const { withCache, semiStaticCache } = await import('@/core/utils/cache-headers')
    
    return withCache(
      NextResponse.json(newsWithMetrics),
      semiStaticCache // Cache 5 min - noticias cambian ocasionalmente
    )
  } catch (error) {
    logError('GET /api/news', error)
    return NextResponse.json(
      formatApiError(error, 'Error al obtener noticias'),
      { status: 500 }
    )
  }
}
