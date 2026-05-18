import { logger as techDebtLogger } from '@/lib/utils/logger'
// API Route: POST /api/communities/[slug]/posts/[postId]/report
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { SessionService } from '@/features/auth/services/session.service'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import type { Database } from '@/lib/supabase/types'

// Schema de validación para el reporte
const reportSchema = z.object({
  reason_category: z.enum(['spam', 'inappropriate', 'harassment', 'misinformation', 'violence', 'other']),
  reason_details: z.string().optional().nullable(),
})

/**
 * POST /api/communities/[slug]/posts/[postId]/report
 * Crea un reporte para un post
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  try {

    const supabase = await createClient()
    const { slug, postId } = await params

    const user = await SessionService.getCurrentUser()

    if (!user) {
      techDebtLogger.error('❌ User not authenticated')
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Validar body
    const body = await request.json()

    const validationResult = reportSchema.safeParse(body)

    if (!validationResult.success) {
      techDebtLogger.error('❌ Validation error:', validationResult.error.errors)
      return NextResponse.json(
        { error: 'Datos inválidos', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { reason_category, reason_details } = validationResult.data

    // Obtener el post
    const { data: post, error: postError } = await supabase
      .from('community_posts')
      .select('id, community_id, user_id')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      techDebtLogger.error('❌ Error fetching post:', postError)
      return NextResponse.json({ 
        error: 'Post no encontrado',
        details: postError?.message,
        code: postError?.code
      }, { status: 404 })
    }

    // Verificar que el post pertenece a la comunidad correcta
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('id, slug')
      .eq('id', post.community_id)
      .eq('slug', slug)
      .single()

    if (communityError || !community) {
      techDebtLogger.error('❌ Error fetching community or post does not belong to community:', communityError)
      return NextResponse.json({ 
        error: 'Post no encontrado en esta comunidad',
        details: communityError?.message,
        code: communityError?.code
      }, { status: 404 })
    }

    // Validar que el usuario no sea el autor del post
    if (post.user_id === user.id) {
      return NextResponse.json(
        { error: 'No puedes reportar tu propio post' },
        { status: 400 }
      )
    }

    // Verificar que la tabla existe primero
    const { error: tableCheckError } = await supabase
      .from('community_post_reports')
      .select('id')
      .limit(1)

    if (tableCheckError) {
      techDebtLogger.error('❌ Table check error:', {
        code: tableCheckError.code,
        message: tableCheckError.message,
        details: tableCheckError.details,
        hint: tableCheckError.hint
      })
      if (tableCheckError.code === '42P01' || tableCheckError.message?.includes('does not exist')) {
        return NextResponse.json(
          { 
            error: 'La tabla de reportes no existe. Por favor ejecuta el script SQL de migración.',
            details: 'Ejecuta el script: scripts/supabase/create-community-post-reports-table.sql',
            code: 'TABLE_NOT_FOUND',
            supabaseError: {
              code: tableCheckError.code,
              message: tableCheckError.message
            }
          },
          { status: 500 }
        )
      }
    }

    // Validar que el usuario no haya reportado este post anteriormente
    const { data: existingReport, error: existingReportError } = await supabase
      .from('community_post_reports')
      .select('id')
      .eq('post_id', postId)
      .eq('reported_by_user_id', user.id)
      .maybeSingle()

    if (existingReportError && existingReportError.code !== 'PGRST116') {
      techDebtLogger.error('❌ Error checking existing report:', {
        error: existingReportError,
        code: existingReportError.code,
        message: existingReportError.message,
        details: existingReportError.details,
        hint: existingReportError.hint
      })
      return NextResponse.json(
        { 
          error: 'Error al verificar reportes existentes',
          details: existingReportError.message || 'Error desconocido',
          code: existingReportError.code,
          supabaseError: {
            code: existingReportError.code,
            message: existingReportError.message,
            hint: existingReportError.hint
          }
        },
        { status: 500 }
      )
    }

    if (existingReport) {

      return NextResponse.json(
        { error: 'Ya has reportado este post anteriormente' },
        { status: 400 }
      )
    }

    // Crear el reporte
    const reportData = {
      post_id: postId,
      community_id: post.community_id,
      reported_by_user_id: user.id,
      reason_category,
      reason_details: reason_details?.trim() || null,
      status: 'pending'
    }

    // Usar cliente admin para bypass RLS ya que el proyecto usa autenticación personalizada
    // La validación de permisos ya se hizo arriba (usuario autenticado, no propio post, etc.)
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseServiceKey) {
      techDebtLogger.error('❌ SUPABASE_SERVICE_ROLE_KEY no está configurada')
      return NextResponse.json(
        { 
          error: 'Error de configuración del servidor',
          details: 'Service role key no configurada'
        },
        { status: 500 }
      )
    }

    const adminSupabase = createServiceClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { data: report, error: reportError } = await adminSupabase
      .from('community_post_reports')
      .insert(reportData)
      .select()
      .single()

    if (reportError) {
      techDebtLogger.error('❌ Error creating report:', {
        error: reportError,
        code: reportError.code,
        message: reportError.message,
        details: reportError.details,
        hint: reportError.hint,
        reportData
      })
      
      // Si es un error de foreign key, dar un mensaje más específico
      if (reportError.code === '23503') {
        return NextResponse.json(
          { 
            error: 'Error de integridad referencial',
            details: reportError.message || 'El post, comunidad o usuario no existe',
            code: reportError.code,
            hint: reportError.hint,
            supabaseError: {
              code: reportError.code,
              message: reportError.message,
              hint: reportError.hint
            }
          },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { 
          error: 'Error al crear el reporte',
          details: reportError.message || 'Error desconocido',
          code: reportError.code,
          hint: reportError.hint,
          supabaseError: {
            code: reportError.code,
            message: reportError.message,
            details: reportError.details,
            hint: reportError.hint
          }
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      report,
      message: 'Reporte enviado exitosamente'
    })
  } catch (error) {
    techDebtLogger.error('❌ Error in POST report API:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

