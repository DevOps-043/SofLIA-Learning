import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AuditLogService } from '@/features/admin/services/auditLog.service'
import { requireInstructor } from '@/lib/auth/requireAdmin'
import { canManageCommunityAccessRequests } from '@/lib/auth/communityPermissions'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, requestId: string }> }
) {
  try {
    // Permitir tanto Administradores como Instructores
    const auth = await requireInstructor()
    if (auth instanceof NextResponse) return auth
    
    const { id: communityId, requestId } = await params
    const supabase = await createClient()

    // Validar que el usuario puede gestionar solicitudes de esta comunidad
    const canManage = await canManageCommunityAccessRequests(auth.userId, communityId)
    if (!canManage) {
      return NextResponse.json({ 
        success: false, 
        message: 'No tienes permisos para gestionar solicitudes de esta comunidad. Solo los Administradores o los Instructores que son admin/creadores de la comunidad pueden hacerlo.' 
      }, { status: 403 })
    }

    // Obtener datos actuales de la solicitud para el log de auditoría
    const { data: currentRequest, error: fetchError } = await supabase
      .from('community_access_requests')
      .select('*')
      .eq('id', requestId)
      .eq('community_id', communityId)
      .single()

    if (fetchError || !currentRequest) {
      return NextResponse.json({ 
        success: false, 
        message: 'Solicitud no encontrada' 
      }, { status: 404 })
    }

    if (currentRequest.status !== 'pending') {
      return NextResponse.json({ 
        success: false, 
        message: 'La solicitud ya ha sido procesada' 
      }, { status: 400 })
    }

    // Actualizar el status de la solicitud a 'approved'
    const { data: updatedRequest, error: updateError } = await supabase
      .from('community_access_requests')
      .update({ 
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: auth.userId // Usar el ID del usuario que aprueba
      })
      .eq('id', requestId)
      .eq('community_id', communityId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ 
        success: false, 
        message: 'Error al aprobar la solicitud' 
      }, { status: 500 })
    }

    // Agregar al usuario como miembro de la comunidad
    const { error: addMemberError } = await supabase
      .from('community_members')
      .insert({
        community_id: communityId,
        user_id: currentRequest.requester_id,
        role: 'member',
        joined_at: new Date().toISOString(),
        is_active: true
      })

    if (addMemberError) {
      // No fallar la operación por esto, solo loguear el error
    }

    // Actualizar el contador de miembros en la comunidad
    // Primero obtener el valor actual
    const { data: currentCommunity, error: fetchCommunityError } = await supabase
      .from('communities')
      .select('member_count')
      .eq('id', communityId)
      .single()

    if (!fetchCommunityError && currentCommunity) {
      const { error: updateCountError } = await supabase
        .from('communities')
        .update({ 
          member_count: (currentCommunity.member_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', communityId)

      if (updateCountError) {
        // No fallar la operación por esto, solo loguear el warning
      }
    }

    // Log de auditoría
    try {
      const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      const userAgent = request.headers.get('user-agent') || 'unknown'

      await AuditLogService.logAction({
        user_id: currentRequest.requester_id,
        admin_user_id: auth.userId,
        action: 'UPDATE',
        table_name: 'community_access_requests',
        record_id: requestId,
        old_values: { status: currentRequest.status },
        new_values: { status: 'approved', reviewed_at: new Date().toISOString() },
        ip_address: ip,
        user_agent: userAgent
      })
    } catch (auditError) {
      // No fallar la operación por esto
    }

    return NextResponse.json({ 
      success: true, 
      request: updatedRequest,
      message: 'Solicitud aprobada exitosamente' 
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ 
      success: false, 
      message 
    }, { status: 500 })
  }
}
