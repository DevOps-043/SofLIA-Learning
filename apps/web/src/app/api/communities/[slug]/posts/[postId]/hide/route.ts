import { NextRequest, NextResponse } from 'next/server'
import { hideCommunityPostSchema, type HideCommunityPostBody } from '@/app/api/communities/_schemas'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { createClient } from '@/lib/supabase/server'
import { SessionService } from '@/features/auth/services/session.service'
import { logger } from '@/lib/logger'

type RouteContext = { params: Promise<{ slug: string; postId: string }> }

/**
 * POST /api/communities/[slug]/posts/[postId]/hide
 * Oculta un post (usuarios pueden ocultar de su feed, moderadores pueden ocultar completamente)
 */
async function handlePost(
  _request: NextRequest,
  _body: HideCommunityPostBody,
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

      const community = Array.isArray(post.community)
        ? post.community[0]
        : post.community

      isModerator =
        membership?.role === 'admin' ||
        membership?.role === 'moderator' ||
        community?.creator_id === user.id
    }

    if (isAdmin || isModerator) {
      const { data: updatedPost, error: updateError } = await supabase
        .from('community_posts')
        .update({
          is_hidden: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', postId)
        .select()
        .single()

      if (updateError) {
        logger.error('Error hiding post:', updateError)
        return apiError('HIDE_POST_FAILED', 'Error al ocultar el post', 500)
      }

      return NextResponse.json({
        success: true,
        post: updatedPost,
        message: 'Post ocultado exitosamente',
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Post ocultado de tu feed',
    })
  } catch (error) {
    logger.error('Error in POST hide API:', error)
    return apiError('HIDE_POST_FAILED', 'Error interno del servidor', 500)
  }
}

export const POST = withZodBody(hideCommunityPostSchema, handlePost, {
  emptyBodyFallback: {},
})
