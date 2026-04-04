import { NextRequest, NextResponse } from 'next/server'
import { requireInstructor } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'
import { createClient } from '@/lib/supabase/server'

import { CreateCommunitySchema } from '@/lib/schemas/community.schema'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    // ✅ SEGURIDAD: Verificar autenticación y autorización de instructor
    const auth = await requireInstructor()
    if (auth instanceof NextResponse) return auth
    
    const instructorId = auth.userId
    const supabase = await createClient()

    logger.log('🔄 Obteniendo comunidades del instructor:', instructorId)

    // ✅ Filtrar comunidades solo del instructor actual usando creator_id
    const { data, error } = await supabase
      .from('community_stats')
      .select('*')
      .eq('creator_id', instructorId) // ✅ Solo comunidades del instructor
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('❌ Error fetching instructor communities:', error)
      return NextResponse.json(
        { error: 'Failed to fetch communities' },
        { status: 500 }
      )
    }

    // Mapear datos de la VIEW al formato AdminCommunity
    const communities = (data || []).map((row: Record<string, unknown>) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      slug: row.slug,
      image_url: row.image_url,
      member_count: row.member_count || 0,
      is_active: row.is_active,
      visibility: row.visibility,
      access_type: row.access_type,
      course_id: row.course_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      course: row.course_id_full ? {
        id: row.course_id_full,
        title: row.course_title,
        slug: row.course_slug,
        thumbnail_url: row.course_thumbnail
      } : undefined,
      creator: row.creator_id ? {
        id: row.creator_id,
        username: row.creator_username || '',
        email: row.creator_email || '',
        display_name: row.creator_display_name ||
                     `${row.creator_first_name || ''} ${row.creator_last_name || ''}`.trim(),
        avatar: row.creator_avatar
      } : undefined,
      creator_name: row.creator_display_name ||
                   `${row.creator_first_name || ''} ${row.creator_last_name || ''}`.trim() ||
                   'Sin creador',
      stats: {
        members_count: row.members_count || 0,
        admin_count: row.admin_count || 0,
        moderator_count: row.moderator_count || 0,
        active_members_count: row.active_members_count || 0,
        posts_count: row.posts_count || 0,
        pinned_posts_count: row.pinned_posts_count || 0,
        total_posts_likes: row.total_posts_likes || 0,
        total_posts_views: row.total_posts_views || 0,
        comments_count: row.comments_count || 0,
        active_comments_count: row.active_comments_count || 0,
        videos_count: row.videos_count || 0,
        active_videos_count: row.active_videos_count || 0,
        pending_requests_count: row.pending_requests_count || 0,
        approved_requests_count: row.approved_requests_count || 0,
        rejected_requests_count: row.rejected_requests_count || 0,
        total_reactions_count: row.total_reactions_count || 0
      },
      posts_count: row.posts_count || 0,
      comments_count: row.comments_count || 0,
      videos_count: row.videos_count || 0,
      access_requests_count: row.pending_requests_count || 0
    }))

    logger.log('✅ Comunidades del instructor obtenidas exitosamente:', communities?.length || 0)
    
    const { withCache, privateCache } = await import('@/core/utils/cache-headers')
    return withCache(
      NextResponse.json({ communities }, { status: 200 }),
      privateCache
    )
  } catch (error) {
    logger.error('💥 Error fetching instructor communities:', error)
    return NextResponse.json(
      { 
        success: false,
        message: 'Error fetching instructor communities',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

// ✅ NUEVO: POST para crear solicitud de comunidad
export async function POST(request: NextRequest) {
  try {
    // ✅ SEGURIDAD: Verificar autenticación y autorización de instructor
    const auth = await requireInstructor()
    if (auth instanceof NextResponse) return auth
    
    const instructorId = auth.userId
    const supabase = await createClient()

    // ✅ SEGURIDAD: Validar datos de entrada
    const body = await request.json()
    const communityData = CreateCommunitySchema.parse(body)

    logger.log('🔄 Instructor solicitando crear comunidad:', instructorId)

    // Función helper para sanitizar slug
    const sanitizeSlug = (text: string): string => {
      return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    }

    // Generar slug único
    let slug = communityData.slug || sanitizeSlug(communityData.name)
    
    // Verificar que el slug no exista en communities ni en solicitudes pendientes
    const { data: existingSlug } = await supabase
      .from('communities')
      .select('slug')
      .eq('slug', slug)
      .single()

    const { data: existingRequest } = await supabase
      .from('community_creation_requests')
      .select('slug')
      .eq('slug', slug)
      .eq('status', 'pending')
      .single()

    if (existingSlug || existingRequest) {
      // Generar slug alternativo
      let counter = 1
      let newSlug = `${slug}-${counter}`
      
      while (true) {
        const { data: checkSlug } = await supabase
          .from('communities')
          .select('slug')
          .eq('slug', newSlug)
          .single()
        
        const { data: checkRequest } = await supabase
          .from('community_creation_requests')
          .select('slug')
          .eq('slug', newSlug)
          .eq('status', 'pending')
          .single()
        
        if (!checkSlug && !checkRequest) {
          slug = newSlug
          break
        }
        counter++
        newSlug = `${slug}-${counter}`
      }
    }

    // Crear solicitud de creación en lugar de comunidad directamente
    const { data: request, error } = await supabase
      .from('community_creation_requests')
      .insert({
        requester_id: instructorId,
        name: communityData.name,
        description: communityData.description || null,
        slug: slug,
        image_url: communityData.image_url || null,
        visibility: (communityData.visibility as 'public' | 'private' | 'unlisted') || 'public',
        access_type: (communityData.access_type as 'open' | 'closed' | 'invite_only' | 'request') || 'open',
        course_id: communityData.course_id || null,
        status: 'pending',
        requester_note: null,
        rejection_reason: null,
        reviewed_by: null,
        reviewed_at: null
      })
      .select()
      .single()

    if (error) {
      logger.error('❌ Error creando solicitud de comunidad:', error)
      return NextResponse.json(
        { 
          success: false,
          error: 'Error al crear la solicitud de comunidad',
          message: error.message
        },
        { status: 500 }
      )
    }

    logger.log('✅ Solicitud de comunidad creada exitosamente:', request.id)
    
    return NextResponse.json({
      success: true,
      message: 'Se ha enviado la solicitud para crear la comunidad al Administrador. Recibirás una notificación cuando sea aprobada.',
      request: {
        id: request.id,
        name: request.name,
        slug: request.slug,
        status: request.status,
        created_at: request.created_at
      }
    }, { status: 201 })
  } catch (error) {
    logger.error('💥 Error creating community request:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Datos inválidos',
          details: error.errors
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false,
        message: 'Error al crear la solicitud de comunidad',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

