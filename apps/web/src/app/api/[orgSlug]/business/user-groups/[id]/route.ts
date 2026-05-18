import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { withZodBody } from '@/lib/api/with-validation'
import { createClient } from '@/lib/supabase/server'
import { SELECT_COLUMNS } from '@/lib/supabase/select-types'
import { logger } from '@/lib/utils/logger'
import { userGroupUpdateSchema, type UserGroupUpdateBody } from './schema'

interface UserGroupUpdatePayload {
  updated_at: string
  name?: string
  description?: string | null
  color?: string | null
}

/**
 * GET /api/[orgSlug]/business/user-groups/[id]
 * Obtiene un grupo específico con sus miembros
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; id: string }> }
) {
  try {
    const { orgSlug, id: groupId } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no pertenece a ninguna organización'
      }, { status: 400 })
    }

    const supabase = await createClient()

    // Obtener el grupo asegurando pertenencia a la organización
    const { data: group, error: groupError } = await supabase
      .from('user_groups')
      .select(SELECT_COLUMNS.user_groups)
      .eq('id', groupId)
      .eq('organization_id', auth.organizationId)
      .maybeSingle()

    if (groupError || !group) {
      return NextResponse.json({
        success: false,
        error: 'Grupo no encontrado'
      }, { status: 404 })
    }

    // Contar miembros
    const { count } = await supabase
      .from('user_group_members')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', groupId)

    return NextResponse.json({
      success: true,
      group: {
        ...group,
        member_count: count || 0
      }
    })
  } catch (error) {
    logger.error('💥 Error in /api/[orgSlug]/business/user-groups/[id] GET:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

/**
 * PUT /api/[orgSlug]/business/user-groups/[id]
 * Actualiza un grupo
 */
async function handlePut(
  _request: NextRequest,
  body: UserGroupUpdateBody,
  { params }: { params: Promise<{ orgSlug: string; id: string }> }
) {
  try {
    const { orgSlug, id: groupId } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no pertenece a ninguna organización'
      }, { status: 400 })
    }

    const supabase = await createClient()
    const { name, description, color } = body

    // Verificar que el grupo exista y pertenezca a la organización
    const { data: existingGroup } = await supabase
      .from('user_groups')
      .select('id, name')
      .eq('id', groupId)
      .eq('organization_id', auth.organizationId)
      .maybeSingle()

    if (!existingGroup) {
      return NextResponse.json({
        success: false,
        error: 'Grupo no encontrado'
      }, { status: 404 })
    }

    // Si se cambia el nombre, verificar que no exista otro grupo con ese nombre
    if (name && name.trim() !== existingGroup.name) {
      const { data: duplicateGroup } = await supabase
        .from('user_groups')
        .select('id')
        .eq('organization_id', auth.organizationId)
        .eq('name', name.trim())
        .neq('id', groupId)
        .maybeSingle()

      if (duplicateGroup) {
        return NextResponse.json({
          success: false,
          error: 'Ya existe un grupo con ese nombre'
        }, { status: 400 })
      }
    }

    // Actualizar el grupo
    const updateData: UserGroupUpdatePayload = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (color !== undefined) updateData.color = color

    const { data: updatedGroup, error: updateError } = await supabase
      .from('user_groups')
      .update(updateData)
      .eq('id', groupId)
      .select()
      .single()

    if (updateError || !updatedGroup) {
      logger.error('Error updating group:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Error al actualizar el grupo'
      }, { status: 500 })
    }

    // Contar miembros
    const { count } = await supabase
      .from('user_group_members')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', groupId)

    return NextResponse.json({
      success: true,
      group: {
        ...updatedGroup,
        member_count: count || 0
      }
    })
  } catch (error) {
    logger.error('💥 Error in /api/[orgSlug]/business/user-groups/[id] PUT:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

export const PUT = withZodBody(userGroupUpdateSchema, handlePut)

/**
 * DELETE /api/[orgSlug]/business/user-groups/[id]
 * Elimina un grupo
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; id: string }> }
) {
  try {
    const { orgSlug, id: groupId } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no pertenece a ninguna organización'
      }, { status: 400 })
    }

    const supabase = await createClient()

    // Verificar que el grupo exista y pertenezca a la organización
    const { data: existingGroup } = await supabase
      .from('user_groups')
      .select('id')
      .eq('id', groupId)
      .eq('organization_id', auth.organizationId)
      .maybeSingle()

    if (!existingGroup) {
      return NextResponse.json({
        success: false,
        error: 'Grupo no encontrado'
      }, { status: 404 })
    }

    // Eliminar el grupo (los miembros se eliminan automáticamente por CASCADE)
    const { error: deleteError } = await supabase
      .from('user_groups')
      .delete()
      .eq('id', groupId)

    if (deleteError) {
      logger.error('Error deleting group:', deleteError)
      return NextResponse.json({
        success: false,
        error: 'Error al eliminar el grupo'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Grupo eliminado exitosamente'
    })
  } catch (error) {
    logger.error('💥 Error in /api/[orgSlug]/business/user-groups/[id] DELETE:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
