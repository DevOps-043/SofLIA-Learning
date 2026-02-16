import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/requireUser'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const auth = await requireUser()
  if (auth instanceof NextResponse) return auth

  try {
    // Only 'Usuario' can create a company through this flow
    if (auth.userRole !== 'Usuario') {
      return NextResponse.json(
        { success: false, error: 'Este flujo es solo para usuarios sin organización.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, contact_email, contact_phone, description, website_url } = body

    if (!name || !contact_email) {
      return NextResponse.json(
        { success: false, error: 'Nombre y email de contacto son requeridos.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check user doesn't already have a pending org creation
    const { data: existingOwnership } = await supabase
      .from('organization_users')
      .select('id, organizations!inner(id, is_active)')
      .eq('user_id', auth.userId)
      .eq('role', 'owner')

    if (existingOwnership && existingOwnership.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Ya tienes una empresa registrada o pendiente de aprobación.' },
        { status: 409 }
      )
    }

    // Check user doesn't have a pending join request
    const { data: existingJoinRequest } = await supabase
      .from('organization_join_requests')
      .select('id')
      .eq('user_id', auth.userId)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingJoinRequest) {
      return NextResponse.json(
        { success: false, error: 'Ya tienes una solicitud pendiente para unirte a una empresa.' },
        { status: 409 }
      )
    }

    // Generate slug from name
    let slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Check slug uniqueness, append random suffix if needed
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (existingOrg) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`
    }

    // Create organization (inactive, pending approval)
    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name,
        slug,
        description: description || null,
        contact_email,
        contact_phone: contact_phone || null,
        website_url: website_url || null,
        subscription_plan: 'team',
        subscription_status: 'pending',
        max_users: 10,
        is_active: false,
      })
      .select('id, name, slug')
      .single()

    if (orgError || !newOrg) {
      logger.error('Error creating organization:', orgError)
      return NextResponse.json(
        { success: false, error: 'Error al crear la empresa.' },
        { status: 500 }
      )
    }

    // Add user as owner
    const { error: memberError } = await supabase
      .from('organization_users')
      .insert({
        organization_id: newOrg.id,
        user_id: auth.userId,
        role: 'owner',
        status: 'active',
        joined_at: new Date().toISOString(),
      })

    if (memberError) {
      logger.error('Error adding owner to organization:', memberError)
      // Rollback: delete the org
      await supabase.from('organizations').delete().eq('id', newOrg.id)
      return NextResponse.json(
        { success: false, error: 'Error al registrar como propietario.' },
        { status: 500 }
      )
    }

    logger.info('Organization created (pending approval)', {
      orgId: newOrg.id,
      userId: auth.userId,
    })

    return NextResponse.json({
      success: true,
      organization: newOrg,
    })
  } catch (error) {
    logger.error('Error in POST /api/organizations/create:', error instanceof Error ? error : undefined)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor.' },
      { status: 500 }
    )
  }
}
