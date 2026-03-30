import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { InviteUserSchema } from '@/lib/schemas/community.schema'
import { z } from 'zod'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const { id: communityId } = await params
    
    // ✅ SEGURIDAD: Validar datos de entrada con Zod
    const body = await request.json()
    const validated = InviteUserSchema.parse(body)
    const { user_id: userId, role } = validated

    const supabase = await createClient()

    // Verificar que la comunidad existe
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('id, name')
      .eq('id', communityId)
      .single()

    if (communityError || !community) {
      return NextResponse.json(
        { success: false, error: 'Comunidad no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que el usuario existe
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, first_name, last_name, display_name, email')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si el usuario ya es miembro
    const { data: existingMember, error: memberError } = await supabase
      .from('community_members')
      .select('id, role')
      .eq('community_id', communityId)
      .eq('user_id', userId)
      .single()

    if (memberError && memberError.code !== 'PGRST116') {
      return NextResponse.json(
        { success: false, error: 'Error al verificar membresía' },
        { status: 500 }
      )
    }

    if (existingMember) {
      return NextResponse.json(
        { success: false, error: 'El usuario ya es miembro de esta comunidad' },
        { status: 400 }
      )
    }

    // Agregar usuario como miembro
    const { data: newMember, error: addError } = await supabase
      .from('community_members')
      .insert({
        community_id: communityId,
        user_id: userId,
        role: role,
        joined_at: new Date().toISOString(),
        is_active: true
      })
      .select(`
        id,
        role,
        joined_at,
        is_active,
        users!inner(
          id,
          first_name,
          last_name,
          display_name,
          email,
          profile_picture_url
        )
      `)
      .single()

    if (addError) {
      return NextResponse.json(
        { success: false, error: 'Error al agregar usuario a la comunidad' },
        { status: 500 }
      )
    }

    // Actualizar contador de miembros en la comunidad
    const { error: updateCountError } = await supabase.rpc('increment_community_member_count', {
      community_id: communityId
    })

    if (updateCountError) {
      // No fallar la operación por esto
    }

    // TODO: Registrar en log de auditoría
    // await AuditLogService.logAction({
    //   user_id: 'admin-user-id',
    //   admin_user_id: 'admin-user-id',
    //   action: 'CREATE',
    //   table_name: 'community_members',
    //   record_id: newMember.id,
    //   old_values: null,
    //   new_values: { community_id: communityId, user_id: userId, role: role },
    //   ip_address: request.headers.get('x-forwarded-for') || 'unknown',
    //   user_agent: request.headers.get('user-agent') || 'unknown'
    // })

    return NextResponse.json({
      success: true,
      member: newMember,
      message: `Usuario agregado exitosamente como ${role}`
    })

  } catch (error) {
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
    
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
