import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AuditLogService } from '@/features/admin/services/auditLog.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, postId: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const { id: communityId, postId } = await params
    const supabase = await createClient()

    // Obtener datos actuales del post
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

    // Toggle el estado de fijado del post
    const newPinnedState = !currentPost.is_pinned
    const { data: updatedPost, error: updateError } = await supabase
      .from('community_posts')
      .update({ 
        is_pinned: newPinnedState,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
      .eq('community_id', communityId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ 
        success: false, 
        message: 'Error al cambiar el estado de fijado del post' 
      }, { status: 500 })
    }

    // Log de auditoría
    try {
      const adminUserId = currentPost.user_id // Usar el autor como admin temporalmente
      const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      const userAgent = request.headers.get('user-agent') || 'unknown'

      await AuditLogService.logAction({
        user_id: currentPost.user_id,
        admin_user_id: adminUserId,
        action: 'UPDATE',
        table_name: 'community_posts',
        record_id: postId,
        old_values: { is_pinned: currentPost.is_pinned },
        new_values: { is_pinned: newPinnedState },
        ip_address: ip,
        user_agent: userAgent
      })
    } catch (auditError) {
      // No fallar la operación por esto
    }

    return NextResponse.json({ 
      success: true, 
      post: updatedPost,
      message: `Post ${newPinnedState ? 'fijado' : 'desfijado'} exitosamente` 
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ 
      success: false, 
      message 
    }, { status: 500 })
  }
}
