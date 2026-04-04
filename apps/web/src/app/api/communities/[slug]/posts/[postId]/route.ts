import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SessionService } from '@/features/auth/services/session.service'
import { logger } from '@/lib/logger'

/**
 * DELETE /api/communities/[slug]/posts/[postId]
 * Elimina un post (solo el autor o moderadores/admins)
 */
export async function DELETE(
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

    // Obtener el post
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

    // Verificar permisos: autor o moderador/admin
    const isAuthor = post.user_id === user.id || post.author_id === user.id
    const isAdmin = user.cargo_rol?.toLowerCase() === 'administrador'
    const isInstructor = user.cargo_rol?.toLowerCase() === 'instructor'
    
    // Verificar si es moderador/admin de la comunidad
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

    if (!isAuthor && !isAdmin && !isModerator) {
      return NextResponse.json({ 
        error: 'No tienes permisos para eliminar este post' 
      }, { status: 403 })
    }

    // Obtener todos los comentarios del post (incluyendo respuestas) para eliminar sus reacciones
    const { data: allComments, error: commentsFetchError } = await supabase
      .from('community_comments')
      .select('id')
      .eq('post_id', postId)

    if (commentsFetchError) {
      logger.error('Error fetching comments:', commentsFetchError)
    }

    const commentIds = allComments?.map(c => c.id) || []

    // 1. Eliminar reacciones en comentarios del post (si hay comentarios)
    if (commentIds.length > 0) {
      const { error: deleteCommentReactionsError } = await supabase
        .from('community_reactions')
        .delete()
        .in('comment_id', commentIds)

      if (deleteCommentReactionsError) {
        logger.error('Error deleting comment reactions:', deleteCommentReactionsError)
        // Continuar aunque falle, intentar eliminar el resto
      }
    }

    // 2. Eliminar reacciones en el post
    const { error: deletePostReactionsError } = await supabase
      .from('community_reactions')
      .delete()
      .eq('post_id', postId)

    if (deletePostReactionsError) {
      logger.error('Error deleting post reactions:', deletePostReactionsError)
      // Continuar aunque falle, intentar eliminar el resto
    }

    // 3. Eliminar todos los comentarios del post (incluyendo respuestas anidadas)
    // Eliminamos todos los comentarios del post de una vez
    // Si hay foreign keys con CASCADE, esto debería funcionar
    // Si no, intentamos eliminar primero las respuestas y luego los principales
    if (commentIds.length > 0) {
      // Intentar eliminar todos los comentarios del post de una vez
      const { error: deleteAllCommentsError } = await supabase
        .from('community_comments')
        .delete()
        .eq('post_id', postId)

      if (deleteAllCommentsError) {
        logger.error('Error deleting all comments, trying recursive approach:', deleteAllCommentsError)
        
        // Si falla, intentar eliminar recursivamente: primero respuestas, luego principales
        // Eliminar respuestas (comentarios hijos)
        const { error: deleteRepliesError } = await supabase
          .from('community_comments')
          .delete()
          .eq('post_id', postId)
          .not('parent_comment_id', 'is', null)

        if (deleteRepliesError) {
          logger.error('Error deleting comment replies:', deleteRepliesError)
        }

        // Luego eliminar comentarios principales
        const { error: deleteMainCommentsError } = await supabase
          .from('community_comments')
          .delete()
          .eq('post_id', postId)
          .is('parent_comment_id', null)

        if (deleteMainCommentsError) {
          logger.error('Error deleting main comments:', deleteMainCommentsError)
          // Continuar aunque falle, intentar eliminar el post
        }
      }
    }

    // 4. Eliminar el post
    const { error: deleteError } = await supabase
      .from('community_posts')
      .delete()
      .eq('id', postId)

    if (deleteError) {
      logger.error('Error deleting post:', deleteError)
      return NextResponse.json({ 
        error: 'Error al eliminar el post. Puede que tenga relaciones que no se pudieron eliminar.' 
      }, { status: 500 })
    }

    // Actualizar contador de posts en la comunidad
    const { data: communityData } = await supabase
      .from('communities')
      .select('posts_count')
      .eq('id', post.community_id)
      .single()

    if (communityData) {
      await supabase
        .from('communities')
        .update({
          posts_count: Math.max((communityData.posts_count || 0) - 1, 0),
          updated_at: new Date().toISOString()
        })
        .eq('id', post.community_id)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Post eliminado exitosamente' 
    })
  } catch (error) {
    logger.error('Error in DELETE post API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/communities/[slug]/posts/[postId]
 * Edita un post (solo el autor)
 */
export async function PUT(
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

    const body = await request.json()
    const { content, title, attachment_url, attachment_type, attachment_data } = body

    // Obtener el post
    const { data: post, error: postError } = await supabase
      .from('community_posts')
      .select('*, community:communities!inner(slug)')
      .eq('id', postId)
      .eq('communities.slug', slug)
      .single()

    if (postError || !post) {
      logger.error('Error fetching post:', postError)
      return NextResponse.json({ error: 'Post no encontrado' }, { status: 404 })
    }

    // Solo el autor puede editar
    const isAuthor = post.user_id === user.id || post.author_id === user.id
    if (!isAuthor) {
      return NextResponse.json({ 
        error: 'No tienes permisos para editar este post' 
      }, { status: 403 })
    }

    // Validar contenido
    if (content !== undefined && (!content || content.trim().length === 0)) {
      return NextResponse.json({ 
        error: 'El contenido no puede estar vacío' 
      }, { status: 400 })
    }

    // Preparar datos de actualización
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      is_edited: true
    }

    if (content !== undefined) updateData.content = content.trim()
    if (title !== undefined) updateData.title = title?.trim() || null
    if (attachment_url !== undefined) updateData.attachment_url = attachment_url || null
    if (attachment_type !== undefined) updateData.attachment_type = attachment_type || null
    if (attachment_data !== undefined) updateData.attachment_data = attachment_data || null

    // Actualizar el post
    const { data: updatedPost, error: updateError } = await supabase
      .from('community_posts')
      .update(updateData)
      .eq('id', postId)
      .select()
      .single()

    if (updateError) {
      logger.error('Error updating post:', updateError)
      return NextResponse.json({ 
        error: 'Error al actualizar el post' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      post: updatedPost 
    })
  } catch (error) {
    logger.error('Error in PUT post API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

