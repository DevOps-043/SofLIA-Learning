import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AuditLogService } from '@/features/admin/services/auditLog.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { UpdateMemberRoleSchema } from '@/lib/schemas/community.schema'
import { z } from 'zod'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, memberId: string }> }
) {
  try {
    // ✅ SEGURIDAD: Verificar autenticación y autorización de admin
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const { id: communityId, memberId } = await params
    
    // ✅ SEGURIDAD: Validar datos de entrada con Zod
    const body = await request.json()
    const validated = UpdateMemberRoleSchema.parse(body)
    const { role } = validated
    const supabase = await createClient()

    // Obtener datos actuales del miembro para el log de auditoría
    const { data: currentMember, error: fetchError } = await supabase
      .from('community_members')
      .select('*')
      .eq('id', memberId)
      .eq('community_id', communityId)
      .single()

    if (fetchError || !currentMember) {
      return NextResponse.json({ 
        success: false, 
        message: 'Miembro no encontrado' 
      }, { status: 404 })
    }

    // Actualizar el rol del miembro
    const { data: updatedMember, error: updateError } = await supabase
      .from('community_members')
      .update({ 
        role: role,
        updated_at: new Date().toISOString()
      })
      .eq('id', memberId)
      .eq('community_id', communityId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ 
        success: false, 
        message: 'Error al actualizar el rol del miembro' 
      }, { status: 500 })
    }

    // Log de auditoría
    // ✅ SEGURIDAD: Usar ID real del administrador autenticado
    const adminUserId = auth.userId
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await AuditLogService.logAction({
      user_id: currentMember.user_id,
      admin_user_id: adminUserId,
      action: 'UPDATE',
      table_name: 'community_members',
      record_id: memberId,
      old_values: { role: currentMember.role },
      new_values: { role: role },
      ip_address: ip,
      user_agent: userAgent
    })

    return NextResponse.json({ 
      success: true, 
      member: updatedMember 
    })
  } catch (error: unknown) {
    // ✅ SEGURIDAD: Manejo específico de errores de validación
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Datos inválidos',
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      }, { status: 400 })
    }
    
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ 
      success: false, 
      message 
    }, { status: 500 })
  }
}
