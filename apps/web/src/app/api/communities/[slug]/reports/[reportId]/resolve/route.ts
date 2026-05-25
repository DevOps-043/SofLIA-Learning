import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'
import {
  resolveCommunityReportSchema,
  type ResolveCommunityReportBody,
} from '@/app/api/communities/_schemas'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { SessionService } from '@/features/auth/services/session.service'
import { canModerateCommunity } from '@/lib/auth/communityPermissions'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/logger'
import type { Database } from '@/lib/supabase/types'

type RouteContext = { params: Promise<{ slug: string; reportId: string }> }

/**
 * PATCH /api/communities/[slug]/reports/[reportId]/resolve
 * Resuelve un reporte (solo admins, owners y moderadores)
 */
async function handlePatch(
  _request: NextRequest,
  body: ResolveCommunityReportBody,
  { params }: RouteContext,
) {
  try {
    const { slug, reportId } = await params
    const user = await SessionService.getCurrentUser()

    if (!user) {
      techDebtLogger.error('User not authenticated')
      return apiError('UNAUTHORIZED', 'No autorizado', 401)
    }

    const { status, resolution_action, resolution_notes } = body

    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseServiceKey) {
      techDebtLogger.error('SUPABASE_SERVICE_ROLE_KEY no está configurada')
      return apiError(
        'SERVER_CONFIGURATION_ERROR',
        'Error de configuración del servidor',
        500,
      )
    }

    const adminSupabase = createServiceClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    const { data: report, error: reportError } = await adminSupabase
      .from('community_post_reports')
      .select(SELECT_COLUMNS.community_post_reports)
      .eq('id', reportId)
      .single()

    if (reportError || !report) {
      techDebtLogger.error('Error fetching report:', reportError)
      return apiError('REPORT_NOT_FOUND', 'Reporte no encontrado', 404)
    }

    const { data: community, error: communityError } = await adminSupabase
      .from('communities')
      .select('id, slug')
      .eq('id', report.community_id)
      .single()

    if (communityError || !community) {
      techDebtLogger.error('Error fetching community:', communityError)
      return apiError('COMMUNITY_NOT_FOUND', 'Comunidad no encontrada', 404)
    }

    if (community.slug !== slug) {
      techDebtLogger.error('Slug mismatch:', { expected: slug, actual: community.slug })
      return apiError(
        'REPORT_COMMUNITY_MISMATCH',
        'El reporte no pertenece a esta comunidad',
        400,
      )
    }

    let post: Record<string, unknown> | null = null
    if (report.post_id) {
      const { data: postData, error: postError } = await adminSupabase
        .from('community_posts')
        .select('id, community_id, user_id')
        .eq('id', report.post_id)
        .single()

      if (postError) {
        techDebtLogger.error('Error fetching post:', postError)
      } else {
        post = postData
      }
    }

    const isAdmin = user.cargo_rol?.toLowerCase() === 'administrador'
    let hasPermission = false

    if (isAdmin) {
      const adminAuth = await requireAdmin()
      hasPermission = !(adminAuth instanceof NextResponse)
    } else {
      hasPermission = await canModerateCommunity(user.id, community.id)
    }

    if (!hasPermission) {
      return apiError(
        'REPORT_RESOLVE_FORBIDDEN',
        'No tienes permisos para resolver este reporte',
        403,
      )
    }

    if (resolution_action === 'delete_post' && post) {
      const { error: deleteError } = await adminSupabase
        .from('community_posts')
        .delete()
        .eq('id', post.id as string)

      if (deleteError) {
        techDebtLogger.error('Error deleting post:', deleteError)
        return apiError('DELETE_POST_FAILED', 'Error al eliminar el post', 500)
      }
    } else if (resolution_action === 'hide_post' && post) {
      const { error: hideError } = await adminSupabase
        .from('community_posts')
        .update({ is_hidden: true, updated_at: new Date().toISOString() })
        .eq('id', post.id as string)

      if (hideError) {
        techDebtLogger.error('Error hiding post:', hideError)
        return apiError('HIDE_POST_FAILED', 'Error al ocultar el post', 500)
      }
    }

    const updateData: Record<string, unknown> = {
      status,
      reviewed_by_user_id: user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (resolution_action) {
      updateData.resolution_action = resolution_action
    }
    if (resolution_notes) {
      updateData.resolution_notes = resolution_notes.trim()
    }

    const { data: updatedReport, error: updateError } = await adminSupabase
      .from('community_post_reports')
      .update(updateData)
      .eq('id', reportId)
      .select(SELECT_COLUMNS.community_post_reports)
      .single()

    if (updateError) {
      techDebtLogger.error('Error updating report:', {
        error: updateError,
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
      })
      return apiError('UPDATE_REPORT_FAILED', 'Error al actualizar el reporte', 500)
    }

    const enrichedReport: Record<string, unknown> = { ...updatedReport }
    const enrichedPost: Record<string, unknown> | null = post ? { ...post } : null

    if (enrichedPost) {
      enrichedReport.post = enrichedPost

      if (post?.user_id) {
        const { data: author } = await adminSupabase
          .from('users')
          .select('id, username, first_name, last_name, profile_picture_url, email')
          .eq('id', post.user_id as string)
          .single()

        if (author) {
          enrichedPost.author = author
        }
      }
    }

    if (updatedReport.reported_by_user_id) {
      const { data: reportedBy } = await adminSupabase
        .from('users')
        .select('id, username, first_name, last_name, profile_picture_url, email')
        .eq('id', updatedReport.reported_by_user_id)
        .single()
      if (reportedBy) {
        enrichedReport.reported_by = reportedBy
      }
    }

    if (updatedReport.reviewed_by_user_id) {
      const { data: reviewedBy } = await adminSupabase
        .from('users')
        .select('id, username, first_name, last_name, email')
        .eq('id', updatedReport.reviewed_by_user_id)
        .single()
      if (reviewedBy) {
        enrichedReport.reviewed_by = reviewedBy
      }
    }

    logger.log('Report resolved successfully', {
      reportId,
      status,
      resolution_action,
      userId: user.id,
    })

    return NextResponse.json({
      success: true,
      report: enrichedReport,
      message: 'Reporte resuelto exitosamente',
    })
  } catch (error) {
    logger.error('Error in PATCH resolve report API:', error)
    return apiError('RESOLVE_REPORT_FAILED', 'Error interno del servidor', 500)
  }
}

export const PATCH = withZodBody(resolveCommunityReportSchema, handlePatch)
