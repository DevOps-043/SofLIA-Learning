import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AuditLogService } from '@/features/admin/services/auditLog.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, memberId: string }> }
) {
  try {
    // ✅ SEGURIDAD: Verificar autenticación y autorización de admin
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const { id: communityId, memberId } = await params
    const supabase = await createClient()

    // Obtener datos del miembro antes de eliminarlo para el log de auditoría
    const { data: memberData, error: fetchError } = await supabase
      .from('community_members')
      .select('*')
      .eq('id', memberId)
      .eq('community_id', communityId)
      .single()

    if (fetchError || !memberData) {
      return NextResponse.json({ 
        success: false, 
        message: 'Miembro no encontrado' 
      }, { status: 404 })
    }

    // Eliminar el miembro de la comunidad
    const { error: deleteError } = await supabase
      .from('community_members')
      .delete()
      .eq('id', memberId)
      .eq('community_id', communityId)

    if (deleteError) {
      return NextResponse.json({ 
        success: false, 
        message: 'Error al remover el miembro' 
      }, { status: 500 })
    }

    // Actualizar el contador de miembros en la comunidad
    const { error: updateCountError } = await supabase
      .from('communities')
      .update({ 
        member_count: supabase.raw('member_count - 1'),
        updated_at: new Date().toISOString()
      })
      .eq('id', communityId)

    if (updateCountError) {
      // No fallar la operación por esto, solo loguear el warning
    }

    // Log de auditoría
    // ✅ SEGURIDAD: Usar ID real del administrador autenticado
    const adminUserId = auth.userId
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await AuditLogService.logAction({
      user_id: memberData.user_id,
      admin_user_id: adminUserId,
      action: 'DELETE',
      table_name: 'community_members',
      record_id: memberId,
      old_values: memberData,
      new_values: null,
      ip_address: ip,
      user_agent: userAgent
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Miembro removido exitosamente' 
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ 
      success: false, 
      message 
    }, { status: 500 })
  }
}
