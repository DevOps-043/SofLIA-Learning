import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AuditLogService } from '@/features/admin/services/auditLog.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, postId: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const { id: communityId, postId } = await params
    const supabase = await createClient()

    // Obtener datos actuales del post para el log de auditoría
    const { data: currentPost, error: fetchError } = await supabase
      .from('community_posts')
      .select('*')
      .eq('id', postId)
      .eq('community_id', communityId)
      .single()

    if (fetchError || !currentPost) {
      return NextResponse.json({ 
        success: false, 
        message: 'Post no encontrado' 
      }, { status: 404 })
    }

    // Eliminar comentarios relacionados
    const { error: deleteCommentsError } = await supabase
      .from('community_comments')
      .delete()
      .eq('post_id', postId)

    if (deleteCommentsError) {
      // No fallar la operación por esto
    }

    // Eliminar reacciones relacionadas
    const { error: deleteReactionsError } = await supabase
      .from('community_reactions')
      .delete()
      .eq('post_id', postId)

    if (deleteReactionsError) {
      // No fallar la operación por esto
    }

    // Eliminar el post
    const { error: deletePostError } = await supabase
      .from('community_posts')
      .delete()
      .eq('id', postId)
      .eq('community_id', communityId)

    if (deletePostError) {
      return NextResponse.json({ 
        success: false, 
        message: 'Error al eliminar el post' 
      }, { status: 500 })
    }

    // Actualizar el contador de posts en la comunidad
    const { data: currentCommunity, error: fetchCommunityError } = await supabase
      .from('communities')
      .select('posts_count')
      .eq('id', communityId)
      .single()

    if (!fetchCommunityError && currentCommunity) {
      const { error: updateCountError } = await supabase
        .from('communities')
        .update({ 
          posts_count: Math.max((currentCommunity.posts_count || 0) - 1, 0),
          updated_at: new Date().toISOString()
        })
        .eq('id', communityId)

      if (updateCountError) {
        // No fallar la operación por esto
      }
    }

    // Log de auditoría
    try {
      const adminUserId = currentPost.author_id // Usar el autor como admin temporalmente
      const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      const userAgent = request.headers.get('user-agent') || 'unknown'

      await AuditLogService.logAction({
        user_id: currentPost.author_id,
        admin_user_id: adminUserId,
        action: 'DELETE',
        table_name: 'community_posts',
        record_id: postId,
        old_values: { 
          title: currentPost.title,
          content: currentPost.content,
          community_id: currentPost.community_id
        },
        new_values: null,
        ip_address: ip,
        user_agent: userAgent
      })
    } catch (auditError) {
      // No fallar la operación por esto
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Post eliminado exitosamente' 
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ 
      success: false, 
      message 
    }, { status: 500 })
  }
}
