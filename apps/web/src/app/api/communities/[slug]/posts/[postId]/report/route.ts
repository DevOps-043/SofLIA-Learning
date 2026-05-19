import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'
import {
  reportCommunityPostSchema,
  type ReportCommunityPostBody,
} from '@/app/api/communities/_schemas'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { SessionService } from '@/features/auth/services/session.service'
import type { Database } from '@/lib/supabase/types'

type RouteContext = { params: Promise<{ slug: string; postId: string }> }

/**
 * POST /api/communities/[slug]/posts/[postId]/report
 * Crea un reporte para un post
 */
async function handlePost(
  _request: NextRequest,
  body: ReportCommunityPostBody,
  { params }: RouteContext,
) {
  try {
    const supabase = await createClient()
    const { slug, postId } = await params
    const user = await SessionService.getCurrentUser()

    if (!user) {
      techDebtLogger.error('User not authenticated')
      return apiError('UNAUTHORIZED', 'No autorizado', 401)
    }

    const { reason_category, reason_details } = body

    const { data: post, error: postError } = await supabase
      .from('community_posts')
      .select('id, community_id, user_id')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      techDebtLogger.error('Error fetching post:', postError)
      return apiError('POST_NOT_FOUND', 'Post no encontrado', 404, {
        details: { code: postError?.code, message: postError?.message },
      })
    }

    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('id, slug')
      .eq('id', post.community_id)
      .eq('slug', slug)
      .single()

    if (communityError || !community) {
      techDebtLogger.error(
        'Error fetching community or post does not belong to community:',
        communityError,
      )
      return apiError(
        'POST_NOT_IN_COMMUNITY',
        'Post no encontrado en esta comunidad',
        404,
        { details: { code: communityError?.code, message: communityError?.message } },
      )
    }

    if (post.user_id === user.id) {
      return apiError('SELF_REPORT_FORBIDDEN', 'No puedes reportar tu propio post', 400)
    }

    const { error: tableCheckError } = await supabase
      .from('community_post_reports')
      .select('id')
      .limit(1)

    if (tableCheckError) {
      techDebtLogger.error('Table check error:', {
        code: tableCheckError.code,
        message: tableCheckError.message,
        details: tableCheckError.details,
        hint: tableCheckError.hint,
      })
      if (tableCheckError.code === '42P01' || tableCheckError.message?.includes('does not exist')) {
        return apiError(
          'TABLE_NOT_FOUND',
          'La tabla de reportes no existe. Por favor ejecuta el script SQL de migración.',
          500,
        )
      }
    }

    const { data: existingReport, error: existingReportError } = await supabase
      .from('community_post_reports')
      .select('id')
      .eq('post_id', postId)
      .eq('reported_by_user_id', user.id)
      .maybeSingle()

    if (existingReportError && existingReportError.code !== 'PGRST116') {
      techDebtLogger.error('Error checking existing report:', {
        error: existingReportError,
        code: existingReportError.code,
        message: existingReportError.message,
        details: existingReportError.details,
        hint: existingReportError.hint,
      })
      return apiError(
        'CHECK_EXISTING_REPORT_FAILED',
        'Error al verificar reportes existentes',
        500,
      )
    }

    if (existingReport) {
      return apiError(
        'POST_ALREADY_REPORTED',
        'Ya has reportado este post anteriormente',
        400,
      )
    }

    const reportData = {
      post_id: postId,
      community_id: post.community_id,
      reported_by_user_id: user.id,
      reason_category,
      reason_details: reason_details?.trim() || null,
      status: 'pending' as const,
    }

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
      .insert(reportData)
      .select()
      .single()

    if (reportError) {
      techDebtLogger.error('Error creating report:', {
        error: reportError,
        code: reportError.code,
        message: reportError.message,
        details: reportError.details,
        hint: reportError.hint,
        reportData,
      })

      if (reportError.code === '23503') {
        return apiError(
          'REFERENTIAL_INTEGRITY_ERROR',
          'Error de integridad referencial',
          400,
          {
            details: {
              code: reportError.code,
              message: reportError.message,
              hint: reportError.hint,
            },
          },
        )
      }

      return apiError('CREATE_REPORT_FAILED', 'Error al crear el reporte', 500)
    }

    return NextResponse.json({
      success: true,
      report,
      message: 'Reporte enviado exitosamente',
    })
  } catch (error) {
    techDebtLogger.error('Error in POST report API:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return apiError('CREATE_REPORT_FAILED', 'Error interno del servidor', 500)
  }
}

export const POST = withZodBody(reportCommunityPostSchema, handlePost)
