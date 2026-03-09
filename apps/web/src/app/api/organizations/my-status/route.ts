import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/requireUser'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export async function GET() {
  const auth = await requireUser({ allowBanned: true })
  if (auth instanceof NextResponse) return auth

  try {
    const supabase = await createClient()

    // ⛔ 1. Verificar si el usuario está baneado globalmente
    const { data: userData } = await supabase
      .from('users')
      .select('is_banned, ban_reason')
      .eq('id', auth.userId)
      .single()

    if (userData?.is_banned) {
      return NextResponse.json({
        success: true,
        status: 'banned',
        banReason: userData.ban_reason || undefined,
      })
    }

    // 2. Check if user is owner of an organization (pending or active)
    const { data: ownershipData } = await supabase
      .from('organization_users')
      .select('organization_id, role, organizations!inner(id, name, slug, is_active, subscription_status)')
      .eq('user_id', auth.userId)
      .eq('role', 'owner')
      .maybeSingle()

    if (ownershipData) {
      const org = ownershipData.organizations as any
      if (org.is_active && org.subscription_status !== 'pending') {
        // Organization was approved
        return NextResponse.json({
          success: true,
          status: 'approved',
          type: 'company_created',
          organizationSlug: org.slug,
          organizationName: org.name,
        })
      }
      // Organization still pending
      return NextResponse.json({
        success: true,
        status: 'pending_company',
        organizationName: org.name,
      })
    }

    // 3. Check if user is already a member of an active org (join was approved)
    const { data: membershipData } = await supabase
      .from('organization_users')
      .select('organization_id, role, organizations!inner(id, name, slug, is_active)')
      .eq('user_id', auth.userId)
      .eq('status', 'active')
      .eq('organizations.is_active', true)
      .maybeSingle()

    if (membershipData) {
      const org = membershipData.organizations as any
      return NextResponse.json({
        success: true,
        status: 'approved',
        type: 'join_approved',
        organizationSlug: org.slug,
        organizationName: org.name,
      })
    }

    // 4. ⛔ Check if user has a SUSPENDED membership (no active ones found above)
    const { data: suspendedMembership } = await supabase
      .from('organization_users')
      .select('organization_id, status, organizations!inner(id, name, slug)')
      .eq('user_id', auth.userId)
      .eq('status', 'suspended')
      .maybeSingle()

    if (suspendedMembership) {
      const org = suspendedMembership.organizations as any
      return NextResponse.json({
        success: true,
        status: 'suspended',
        organizationName: org.name,
        organizationSlug: org.slug,
      })
    }

    // 5. Check for pending/rejected join requests
    const { data: joinRequest } = await supabase
      .from('organization_join_requests')
      .select('id, status, organization_id, organizations!inner(name, slug)')
      .eq('user_id', auth.userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (joinRequest) {
      const org = joinRequest.organizations as any
      if (joinRequest.status === 'pending') {
        return NextResponse.json({
          success: true,
          status: 'pending_join',
          organizationName: org.name,
        })
      }
      if (joinRequest.status === 'rejected') {
        return NextResponse.json({
          success: true,
          status: 'rejected',
          organizationName: org.name,
        })
      }
    }

    // No pending anything
    return NextResponse.json({
      success: true,
      status: 'none',
    })
  } catch (error) {
    logger.error('Error in GET /api/organizations/my-status:', error instanceof Error ? error : undefined)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor.' },
      { status: 500 }
    )
  }
}
