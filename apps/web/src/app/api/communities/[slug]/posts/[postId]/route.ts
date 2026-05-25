import { NextRequest, NextResponse } from 'next/server'
import {
  updateCommunityPostSchema,
  type UpdateCommunityPostBody,
} from '@/app/api/communities/_schemas'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { sanitizePost } from '@/lib/sanitize/html-sanitizer.shortcuts'
import { createClient } from '@/lib/supabase/server'
import { SessionService } from '@/features/auth/services/session.service'
import { logger } from '@/lib/logger'

type RouteContext = { params: Promise<{ slug: string; postId: string }> }

/**
 * DELETE /api/communities/[slug]/posts/[postId]
 * Elimina un post (solo el autor o moderadores/admins)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const supabase = await createClient()
    const { slug, postId } = await params
    const user = await SessionService.getCurrentUser()

    if (!user) {
      return apiError('UNAUTHORIZED', 'No autorizado', 401)
    }

    const { data: post, error: postError } = await supabase
      .from('community_posts')
      .select('*, community:communities!inner(id, slug, creator_id)')
      .eq('id', postId)
      .eq('communities.slug', slug)
      .single()

    if (postError || !post) {
      logger.error('Error fetching post:', postError)
      return apiError('POST_NOT_FOUND', 'Post no encontrado', 404)
    }

    const isAuthor = post.user_id === user.id || post.author_id === user.id
    const isAdmin = user.cargo_rol?.toLowerCase() === 'administrador'
    const isInstructor = user.cargo_rol?.toLowerCase() === 'instructor'

    let isModerator = false
    if (isInstructor || isAdmin) {
      const { data: membership } = await supabase
        .from('community_members')
        .select('role')
        .eq('community_id', post.community_id)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      const community = Array.isArray(post.community)
        ? post.community[0]
        : post.community

      isModerator =
        membership?.role === 'admin' ||
        membership?.role === 'moderator' ||
        community?.creator_id === user.id
    }

    if (!isAuthor && !isAdmin && !isModerator) {
      return apiError(
        'POST_DELETE_FORBIDDEN',
        'No tienes permisos para eliminar este post',
        403,
      )
    }

    const { data: allComments, error: commentsFetchError } = await supabase
      .from('community_comments')
      .select('id')
      .eq('post_id', postId)

    if (commentsFetchError) {
      logger.error('Error fetching comments:', commentsFetchError)
    }

    const commentIds = allComments?.map((comment) => comment.id) || []

    if (commentIds.length > 0) {
      const { error: deleteCommentReactionsError } = await supabase
        .from('community_reactions')
        .delete()
        .in('comment_id', commentIds)

      if (deleteCommentReactionsError) {
        logger.error('Error deleting comment reactions:', deleteCommentReactionsError)
      }
    }

    const { error: deletePostReactionsError } = await supabase
      .from('community_reactions')
      .delete()
      .eq('post_id', postId)

    if (deletePostReactionsError) {
      logger.error('Error deleting post reactions:', deletePostReactionsError)
    }

    if (commentIds.length > 0) {
      const { error: deleteAllCommentsError } = await supabase
        .from('community_comments')
        .delete()
        .eq('post_id', postId)

      if (deleteAllCommentsError) {
        logger.error(
          'Error deleting all comments, trying recursive approach:',
          deleteAllCommentsError,
        )

        const { error: deleteRepliesError } = await supabase
          .from('community_comments')
          .delete()
          .eq('post_id', postId)
          .not('parent_comment_id', 'is', null)

        if (deleteRepliesError) {
          logger.error('Error deleting comment replies:', deleteRepliesError)
        }

        const { error: deleteMainCommentsError } = await supabase
          .from('community_comments')
          .delete()
          .eq('post_id', postId)
          .is('parent_comment_id', null)

        if (deleteMainCommentsError) {
          logger.error('Error deleting main comments:', deleteMainCommentsError)
        }
      }
    }

    const { error: deleteError } = await supabase
      .from('community_posts')
      .delete()
      .eq('id', postId)

    if (deleteError) {
      logger.error('Error deleting post:', deleteError)
      return apiError(
        'DELETE_POST_FAILED',
        'Error al eliminar el post. Puede que tenga relaciones que no se pudieron eliminar.',
        500,
      )
    }

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
          updated_at: new Date().toISOString(),
        })
        .eq('id', post.community_id)
    }

    return NextResponse.json({
      success: true,
      message: 'Post eliminado exitosamente',
    })
  } catch (error) {
    logger.error('Error in DELETE post API:', error)
    return apiError('DELETE_POST_FAILED', 'Error interno del servidor', 500)
  }
}

/**
 * PUT /api/communities/[slug]/posts/[postId]
 * Edita un post (solo el autor)
 */
async function handlePut(
  _request: NextRequest,
  body: UpdateCommunityPostBody,
  { params }: RouteContext,
) {
  try {
    const supabase = await createClient()
    const { slug, postId } = await params
    const user = await SessionService.getCurrentUser()

    if (!user) {
      return apiError('UNAUTHORIZED', 'No autorizado', 401)
    }

    const { content, title, attachment_url, attachment_type, attachment_data } = body

    const { data: post, error: postError } = await supabase
      .from('community_posts')
      .select('*, community:communities!inner(slug)')
      .eq('id', postId)
      .eq('communities.slug', slug)
      .single()

    if (postError || !post) {
      logger.error('Error fetching post:', postError)
      return apiError('POST_NOT_FOUND', 'Post no encontrado', 404)
    }

    const isAuthor = post.user_id === user.id || post.author_id === user.id
    if (!isAuthor) {
      return apiError(
        'POST_EDIT_FORBIDDEN',
        'No tienes permisos para editar este post',
        403,
      )
    }

    const sanitizedContent =
      content !== undefined ? sanitizePost(content).trim() : undefined

    if (sanitizedContent !== undefined && sanitizedContent.length === 0) {
      return apiError('EMPTY_CONTENT', 'El contenido no puede estar vacío', 400)
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      is_edited: true,
    }

    if (sanitizedContent !== undefined) updateData.content = sanitizedContent
    if (title !== undefined) updateData.title = title?.trim() || null
    if (attachment_url !== undefined) updateData.attachment_url = attachment_url || null
    if (attachment_type !== undefined) updateData.attachment_type = attachment_type || null
    if (attachment_data !== undefined) updateData.attachment_data = attachment_data || null

    const { data: updatedPost, error: updateError } = await supabase
      .from('community_posts')
      .update(updateData)
      .eq('id', postId)
      .select()
      .single()

    if (updateError) {
      logger.error('Error updating post:', updateError)
      return apiError('UPDATE_POST_FAILED', 'Error al actualizar el post', 500)
    }

    return NextResponse.json({
      success: true,
      post: updatedPost,
    })
  } catch (error) {
    logger.error('Error in PUT post API:', error)
    return apiError('UPDATE_POST_FAILED', 'Error interno del servidor', 500)
  }
}

export const PUT = withZodBody(updateCommunityPostSchema, handlePut)
