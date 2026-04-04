import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

interface UserGroupSummary {
  id: string
  organization_id: string
  name: string
  description: string | null
  color: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

/**
 * GET /api/[orgSlug]/business/user-groups
 * Obtiene todos los grupos de usuarios de la organización
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const { orgSlug } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no pertenece a ninguna organización'
      }, { status: 400 })
    }

    const supabase = await createClient()

    // Obtener grupos con conteo de miembros
    const { data: groups, error: groupsError } = await supabase
      .from('user_groups')
      .select(`
        id,
        organization_id,
        name,
        description,
        color,
        created_by,
        created_at,
        updated_at
      `)
      .eq('organization_id', auth.organizationId)
      .order('created_at', { ascending: false })

    if (groupsError) {
      logger.error('Error fetching groups:', groupsError)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener grupos',
        groups: []
      }, { status: 500 })
    }

    // Contar miembros para cada grupo
    const groupsWithCount = await Promise.all(
      (groups || []).map(async (group: UserGroupSummary) => {
        const { count } = await supabase
          .from('user_group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id)

        return {
          ...group,
          member_count: count || 0
        }
      })
    )

    return NextResponse.json({
      success: true,
      groups: groupsWithCount
    })
  } catch (error) {
    logger.error('💥 Error in /api/[orgSlug]/business/user-groups:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      groups: []
    }, { status: 500 })
  }
}

/**
 * POST /api/[orgSlug]/business/user-groups
 * Crea un nuevo grupo de usuarios
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const { orgSlug } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no pertenece a ninguna organización'
      }, { status: 400 })
    }

    const supabase = await createClient()
    const body = await request.json()
    const { name, description, color } = body

    if (!name || name.trim() === '') {
      return NextResponse.json({
        success: false,
        error: 'El nombre del grupo es requerido'
      }, { status: 400 })
    }

    // Verificar que el nombre no exista ya en la organización
    const { data: existingGroup } = await supabase
      .from('user_groups')
      .select('id')
      .eq('organization_id', auth.organizationId)
      .eq('name', name.trim())
      .maybeSingle()

    if (existingGroup) {
      return NextResponse.json({
        success: false,
        error: 'Ya existe un grupo con ese nombre en tu organización'
      }, { status: 400 })
    }

    // Crear el grupo
    const { data: newGroup, error: createError } = await supabase
      .from('user_groups')
      .insert({
        organization_id: auth.organizationId,
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#3b82f6',
        created_by: auth.userId
      })
      .select()
      .single()

    if (createError || !newGroup) {
      logger.error('Error creating group:', createError)
      return NextResponse.json({
        success: false,
        error: 'Error al crear el grupo'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      group: {
        ...newGroup,
        member_count: 0
      }
    })
  } catch (error) {
    logger.error('💥 Error in /api/[orgSlug]/business/user-groups POST:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
