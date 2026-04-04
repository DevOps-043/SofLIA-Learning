import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/logger'

/**
 * GET /api/admin/communities/slug/[slug]/reports
 * Obtiene todos los reportes de una comunidad (solo administradores)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const supabase = await createClient()
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    
    // Filtros opcionales
    const status = searchParams.get('status') // pending, reviewed, resolved, ignored
    const reasonCategory = searchParams.get('reason_category')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Obtener la comunidad por slug
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('id')
      .eq('slug', slug)
      .single()

    if (communityError || !community) {
      logger.error('Error fetching community:', communityError)
      return NextResponse.json(
        { error: 'Comunidad no encontrada' },
        { status: 404 }
      )
    }

    // Construir query base - simplificada
    let query = supabase
      .from('community_post_reports')
      .select('*')
      .eq('community_id', community.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Aplicar filtros
    if (status) {
      query = query.eq('status', status)
    }
    if (reasonCategory) {
      query = query.eq('reason_category', reasonCategory)
    }

    const { data: reports, error: reportsError } = await query

    if (reportsError) {
      logger.error('Error fetching reports:', {
        error: reportsError,
        message: reportsError.message,
        code: reportsError.code,
        details: reportsError.details,
        hint: reportsError.hint
      })
      return NextResponse.json(
        { 
          error: 'Error al obtener reportes',
          details: reportsError.message || 'Error desconocido',
          code: reportsError.code
        },
        { status: 500 }
      )
    }

    // Enriquecer reportes con información relacionada
    const enrichedReports = await Promise.all(
      (reports || []).map(async (report) => {
        const enriched: Record<string, unknown> = { ...report }

        // Obtener información del post
        if (report.post_id) {
          const { data: post } = await supabase
            .from('community_posts')
            .select('id, content, created_at, user_id')
            .eq('id', report.post_id)
            .single()

          if (post) {
            enriched.post = post

            // Obtener información del autor del post
            if (post.user_id) {
              const { data: author } = await supabase
                .from('users')
                .select('id, username, first_name, last_name, profile_picture_url, email')
                .eq('id', post.user_id)
                .single()

              if (author) {
                enriched.post.author = author
              }
            }
          }
        }

        // Obtener información del usuario que reportó
        if (report.reported_by_user_id) {
          const { data: reportedBy } = await supabase
            .from('users')
            .select('id, username, first_name, last_name, profile_picture_url, email')
            .eq('id', report.reported_by_user_id)
            .single()

          if (reportedBy) {
            enriched.reported_by = reportedBy
          }
        }

        // Obtener información del usuario que revisó
        if (report.reviewed_by_user_id) {
          const { data: reviewedBy } = await supabase
            .from('users')
            .select('id, username, first_name, last_name, email')
            .eq('id', report.reviewed_by_user_id)
            .single()

          if (reviewedBy) {
            enriched.reviewed_by = reviewedBy
          }
        }

        return enriched
      })
    )

    // Obtener total de reportes para paginación
    let countQuery = supabase
      .from('community_post_reports')
      .select('id', { count: 'exact', head: true })
      .eq('community_id', community.id)

    if (status) {
      countQuery = countQuery.eq('status', status)
    }
    if (reasonCategory) {
      countQuery = countQuery.eq('reason_category', reasonCategory)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      logger.error('Error counting reports:', countError)
    }

    return NextResponse.json({
      success: true,
      reports: enrichedReports || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })
  } catch (error) {
    logger.error('Error in GET admin reports API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

