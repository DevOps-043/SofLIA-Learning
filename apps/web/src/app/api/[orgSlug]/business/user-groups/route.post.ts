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
