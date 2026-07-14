import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SessionService } from '@/features/auth/services/session.service'
import { logger } from '@/lib/logger'

/**
 * PATCH /api/communities/[slug]/posts/[postId]/pin
 * Fija o desfija un post (solo moderadores/admins)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  try {
    const supabase = await createClient()
    const { slug, postId } = await params
    const user = await SessionService.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener el post y la comunidad
    const { data: post, error: postError } = await supabase
      .from('community_posts')
      .select('*, community:communities!inner(id, slug, creator_id)')
      .eq('id', postId)
      .eq('communities.slug', slug)
      .single()

    if (postError || !post) {
      logger.error('Error fetching post:', postError)
      return NextResponse.json({ error: 'Post no encontrado' }, { status: 404 })
    }

    // Verificar permisos: solo moderadores/admins
    const isAdmin = user.platform_role?.toLowerCase() === 'administrador'
    const isInstructor = user.platform_role?.toLowerCase() === 'instructor'
    
    let isModerator = false
    if (isInstructor || isAdmin) {
      const { data: membership } = await supabase
        .from('community_members')
        .select('role')
        .eq('community_id', post.community_id)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      isModerator = membership?.role === 'admin' || membership?.role === 'moderator' || 
                   post.community.creator_id === user.id
    }

    if (!isAdmin && !isModerator) {
      return NextResponse.json({ 
        error: 'No tienes permisos para fijar/desfijar posts' 
      }, { status: 403 })
    }

    // Toggle el estado de fijado
    const newPinState = !post.is_pinned

    const { data: updatedPost, error: updateError } = await supabase
      .from('community_posts')
      .update({ 
        is_pinned: newPinState,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
      .select()
      .single()

    if (updateError) {
      logger.error('Error updating post pin:', updateError)
      return NextResponse.json({ 
        error: 'Error al fijar/desfijar el post' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      post: updatedPost,
      message: newPinState ? 'Post fijado exitosamente' : 'Post desfijado exitosamente'
    })
  } catch (error) {
    logger.error('Error in PATCH pin API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}




