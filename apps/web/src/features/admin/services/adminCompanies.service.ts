import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

export interface AdminCompanyMember {
  id: string
  user_id: string
  role: string | null
  status: string | null
  joined_at: string | null
  user?: {
    id: string
    email: string
    username: string | null
    first_name: string | null
    last_name: string | null
    display_name: string | null
    profile_picture_url: string | null
  }
}

export interface AdminCompany {
  id: string
  name: string
  slug: string | null
  description: string | null
  logo_url: string | null
  brand_logo_url: string | null
  brand_banner_url: string | null
  brand_favicon_url: string | null
  // Branding colors
  brand_color_primary: string | null
  brand_color_secondary: string | null
  brand_color_accent: string | null
  brand_font_family: string | null
  // Contact
  contact_email: string | null
  contact_phone: string | null
  website_url: string | null
  // Subscription
  subscription_plan: string | null
  subscription_status: string | null
  subscription_start_date: string | null
  subscription_end_date: string | null
  is_active: boolean
  max_users: number | null
  // Stats
  total_users: number
  active_users: number
  invited_users: number
  suspended_users: number
  // SSO Enablement
  google_login_enabled: boolean
  microsoft_login_enabled: boolean
  // Dates
  created_at: string
  updated_at: string
  // Members & Invitations
  members: AdminCompanyMember[]
  pending_invitations?: any[]
  bulk_invite_links?: any[]
}

export interface CompanyStats {
  totalCompanies: number
  activeCompanies: number
  trialCompanies: number
  pausedCompanies: number
  pendingCompanies: number
  totalSeats: number
  usedSeats: number
  averageUtilization: number
}

export interface CompanyUpdatePayload {
  name?: string
  slug?: string | null
  description?: string | null
  logo_url?: string | null
  brand_logo_url?: string | null
  brand_banner_url?: string | null
  brand_favicon_url?: string | null
  brand_color_primary?: string | null
  brand_color_secondary?: string | null
  brand_color_accent?: string | null
  brand_font_family?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  website_url?: string | null
  is_active?: boolean
  subscription_status?: string
  subscription_plan?: string
  max_users?: number
  google_login_enabled?: boolean
  microsoft_login_enabled?: boolean
}

interface OrganizationUserRow {
  id: string
  user_id: string
  role: string | null
  status: string | null
  joined_at: string | null
  users?: {
    id: string
    email: string
    username: string | null
    first_name: string | null
    last_name: string | null
    display_name: string | null
    profile_picture_url: string | null
  } | null
}

interface OrganizationRow {
  id: string
  name: string
  slug: string | null
  description: string | null
  logo_url: string | null
  brand_logo_url: string | null
  brand_banner_url: string | null
  brand_favicon_url: string | null
  brand_color_primary: string | null
  brand_color_secondary: string | null
  brand_color_accent: string | null
  brand_font_family: string | null
  contact_email: string | null
  contact_phone: string | null
  website_url: string | null
  subscription_plan: string | null
  subscription_status: string | null
  subscription_start_date: string | null
  subscription_end_date: string | null
  is_active: boolean | null
  max_users: number | null
  created_at: string | null
  updated_at: string | null
  google_login_enabled: boolean | null
  microsoft_login_enabled: boolean | null
  organization_users?: OrganizationUserRow[] | null
}

export class AdminCompaniesService {
  private static mapOrganization(row: OrganizationRow): AdminCompany {
    const orgUsers = row.organization_users || []
    const totalUsers = orgUsers.length
    const activeUsers = orgUsers.filter(m => m.status === 'active').length
    const suspendedUsers = orgUsers.filter(m => m.status === 'suspended').length

    const members: AdminCompanyMember[] = orgUsers.map(m => ({
      id: m.id,
      user_id: m.user_id,
      role: m.role,
      status: m.status,
      joined_at: m.joined_at,
      user: m.users ? {
        id: m.users.id,
        email: m.users.email,
        username: m.users.username,
        first_name: m.users.first_name,
        last_name: m.users.last_name,
        display_name: m.users.display_name,
        profile_picture_url: m.users.profile_picture_url
      } : undefined
    }))

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      logo_url: row.logo_url,
      brand_logo_url: row.brand_logo_url,
      brand_banner_url: row.brand_banner_url,
      brand_favicon_url: row.brand_favicon_url,
      brand_color_primary: row.brand_color_primary ?? '#3b82f6',
      brand_color_secondary: row.brand_color_secondary ?? '#10b981',
      brand_color_accent: row.brand_color_accent ?? '#8b5cf6',
      brand_font_family: row.brand_font_family ?? 'Inter',
      contact_email: row.contact_email,
      contact_phone: row.contact_phone,
      website_url: row.website_url,
      subscription_plan: row.subscription_plan,
      subscription_status: row.subscription_status,
      subscription_start_date: row.subscription_start_date,
      subscription_end_date: row.subscription_end_date,
      is_active: row.is_active ?? true,
      max_users: row.max_users,
      total_users: totalUsers,
      active_users: activeUsers,
      invited_users: 0, // Will be populated in the service methods
      suspended_users: suspendedUsers,
      google_login_enabled: row.google_login_enabled ?? false,
      microsoft_login_enabled: row.microsoft_login_enabled ?? false,
      created_at: row.created_at || new Date().toISOString(),
      updated_at: row.updated_at || new Date().toISOString(),
      members
    }
  }

  static async getCompanies(): Promise<AdminCompany[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('organizations')
      .select(`
        id,
        name,
        slug,
        description,
        logo_url,
        brand_logo_url,
        brand_banner_url,
        brand_favicon_url,
        brand_color_primary,
        brand_color_secondary,
        brand_color_accent,
        brand_font_family,
        contact_email,
        contact_phone,
        website_url,
        subscription_plan,
        subscription_status,
        subscription_start_date,
        subscription_end_date,
        is_active,
        max_users,
        google_login_enabled,
        microsoft_login_enabled,
        created_at,
        updated_at,
        organization_users (
          id,
          user_id,
          role,
          status,
          joined_at
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('❌ Error fetching organizations:', error)
      throw error
    }

    const organizations = (data as unknown as OrganizationRow[] | null) ?? []

    // Obtener datos de usuarios para los miembros
    const allUserIds = new Set<string>()
    organizations.forEach(org => {
      org.organization_users?.forEach(member => {
        allUserIds.add(member.user_id)
      })
    })

    const usersMap: Map<string, { id: string; email: string; username: string | null; first_name: string | null; last_name: string | null; display_name: string | null; profile_picture_url: string | null }> = new Map()

    if (allUserIds.size > 0) {
      const { data: usersData } = await supabase
        .from('users')
        .select('id, email, username, first_name, last_name, display_name, profile_picture_url')
        .in('id', Array.from(allUserIds))

      if (usersData) {
        usersData.forEach((user: { id: string; email: string; username: string | null; first_name: string | null; last_name: string | null; display_name: string | null; profile_picture_url: string | null }) => {
          usersMap.set(user.id, user)
        })
      }
    }

    // Obtener conteo de invitaciones pendientes por organización
    const { data: invCountData } = await supabase
      .from('user_invitations')
      .select('organization_id')
      .eq('status', 'pending')

    const invitationCountsMap: Record<string, number> = {}
    if (invCountData) {
      invCountData.forEach(inv => {
        invitationCountsMap[inv.organization_id] = (invitationCountsMap[inv.organization_id] || 0) + 1
      })
    }

    // Mapear organizaciones con datos de usuarios
    return organizations.map(org => {
      const orgUsers = org.organization_users || []
      const totalUsers = orgUsers.length
      const activeUsers = orgUsers.filter(m => m.status === 'active').length
      const invitedUsersInOrg = orgUsers.filter(m => m.status === 'invited').length
      const suspendedUsers = orgUsers.filter(m => m.status === 'suspended').length
      const pendingInvCount = invitationCountsMap[org.id] || 0
      const totalInvited = invitedUsersInOrg + pendingInvCount

      const members: AdminCompanyMember[] = orgUsers.map(m => ({
        id: m.id,
        user_id: m.user_id,
        role: m.role,
        status: m.status,
        joined_at: m.joined_at,
        user: usersMap.get(m.user_id)
      }))

      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        description: org.description,
        logo_url: org.logo_url,
        brand_logo_url: org.brand_logo_url,
        brand_banner_url: org.brand_banner_url,
        brand_favicon_url: org.brand_favicon_url,
        brand_color_primary: org.brand_color_primary ?? '#3b82f6',
        brand_color_secondary: org.brand_color_secondary ?? '#10b981',
        brand_color_accent: org.brand_color_accent ?? '#8b5cf6',
        brand_font_family: org.brand_font_family ?? 'Inter',
        contact_email: org.contact_email,
        contact_phone: org.contact_phone,
        website_url: org.website_url,
        subscription_plan: org.subscription_plan,
        subscription_status: org.subscription_status,
        subscription_start_date: org.subscription_start_date,
        subscription_end_date: org.subscription_end_date,
        is_active: org.is_active ?? true,
        max_users: org.max_users,
        total_users: totalUsers,
        active_users: activeUsers,
        invited_users: totalInvited,
        suspended_users: suspendedUsers,
        google_login_enabled: org.google_login_enabled ?? false,
        microsoft_login_enabled: org.microsoft_login_enabled ?? false,
        created_at: org.created_at || new Date().toISOString(),
        updated_at: org.updated_at || new Date().toISOString(),
        members
      }
    })
  }

  static calculateStats(companies: AdminCompany[]): CompanyStats {
    const stats = companies.reduce(
      (acc, company) => {
        acc.totalCompanies += 1

        const normalizedStatus = company.subscription_status?.toLowerCase()

        if (normalizedStatus === 'pending' && !company.is_active) {
          acc.pendingCompanies += 1
        } else if (company.is_active) {
          acc.activeCompanies += 1
        } else {
          acc.pausedCompanies += 1
        }

        if (
          normalizedStatus === 'trial' ||
          (company.subscription_plan && company.subscription_plan.toLowerCase() === 'trial')
        ) {
          acc.trialCompanies += 1
        }

        acc.totalSeats += company.max_users || 0
        acc.usedSeats += company.active_users
        return acc
      },
      {
        totalCompanies: 0,
        activeCompanies: 0,
        trialCompanies: 0,
        pausedCompanies: 0,
        pendingCompanies: 0,
        totalSeats: 0,
        usedSeats: 0
      }
    )

    const averageUtilization =
      stats.totalCompanies > 0 ? Math.round((stats.usedSeats / Math.max(stats.totalSeats, 1)) * 100) : 0

    return {
      ...stats,
      averageUtilization
    }
  }

  static async getCompanyById(id: string): Promise<AdminCompany | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('organizations')
      .select(`
        id,
        name,
        slug,
        description,
        logo_url,
        brand_logo_url,
        brand_banner_url,
        brand_favicon_url,
        brand_color_primary,
        brand_color_secondary,
        brand_color_accent,
        brand_font_family,
        contact_email,
        contact_phone,
        website_url,
        subscription_plan,
        subscription_status,
        subscription_start_date,
        subscription_end_date,
        is_active,
        max_users,
        google_login_enabled,
        microsoft_login_enabled,
        created_at,
        updated_at,
        organization_users (
          id,
          user_id,
          role,
          status,
          joined_at
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      logger.error('❌ Error fetching organization by id:', error)
      return null
    }

    if (!data) return null

    // Obtener datos de usuarios
    const orgUsers = (data as unknown as OrganizationRow).organization_users || []
    const allUserIds = orgUsers.map(m => m.user_id)

    let usersMap: Map<string, { id: string; email: string; username: string | null; first_name: string | null; last_name: string | null; display_name: string | null; profile_picture_url: string | null }> = new Map()

    if (allUserIds.length > 0) {
      const { data: usersData } = await supabase
        .from('users')
        .select('id, email, username, first_name, last_name, display_name, profile_picture_url')
        .in('id', allUserIds)

      if (usersData) {
        usersData.forEach((user: { id: string; email: string; username: string | null; first_name: string | null; last_name: string | null; display_name: string | null; profile_picture_url: string | null }) => {
          usersMap.set(user.id, user)
        })
      }
    }

    const org = data as unknown as OrganizationRow
    const totalUsers = orgUsers.length
    const activeUsers = orgUsers.filter(m => m.status === 'active').length
    const invitedUsersInOrg = orgUsers.filter(m => m.status === 'invited').length
    const suspendedUsers = orgUsers.filter(m => m.status === 'suspended').length

    // Pendientes en user_invitations
    const { data: pendingInvitations } = await supabase
      .from('user_invitations')
      .select('*')
      .eq('organization_id', id)
      .eq('status', 'pending')

    // Enlaces masivos en bulk_invite_links
    const { data: bulkLinks } = await supabase
      .from('bulk_invite_links')
      .select('*')
      .eq('organization_id', id)

    const totalInvited = invitedUsersInOrg + (pendingInvitations?.length || 0)

    const members: AdminCompanyMember[] = orgUsers.map(m => ({
      id: m.id,
      user_id: m.user_id,
      role: m.role,
      status: m.status,
      joined_at: m.joined_at,
      user: usersMap.get(m.user_id)
    }))

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      description: org.description,
      logo_url: org.logo_url,
      brand_logo_url: org.brand_logo_url,
      brand_banner_url: org.brand_banner_url,
      brand_favicon_url: org.brand_favicon_url,
      brand_color_primary: org.brand_color_primary ?? '#3b82f6',
      brand_color_secondary: org.brand_color_secondary ?? '#10b981',
      brand_color_accent: org.brand_color_accent ?? '#8b5cf6',
      brand_font_family: org.brand_font_family ?? 'Inter',
      contact_email: org.contact_email,
      contact_phone: org.contact_phone,
      website_url: org.website_url,
      subscription_plan: org.subscription_plan,
      subscription_status: org.subscription_status,
      subscription_start_date: org.subscription_start_date,
      subscription_end_date: org.subscription_end_date,
      is_active: org.is_active ?? true,
      max_users: org.max_users,
      total_users: totalUsers,
      active_users: activeUsers,
      invited_users: totalInvited,
      suspended_users: suspendedUsers,
      google_login_enabled: org.google_login_enabled ?? false,
      microsoft_login_enabled: org.microsoft_login_enabled ?? false,
      created_at: org.created_at || new Date().toISOString(),
      updated_at: org.updated_at || new Date().toISOString(),
      members,
      pending_invitations: pendingInvitations || [],
      bulk_invite_links: bulkLinks || []
    }
  }

  static async updateCompany(id: string, updates: CompanyUpdatePayload): Promise<AdminCompany> {
    const supabase = await createClient()

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    // Campos básicos
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.slug !== undefined) updateData.slug = updates.slug
    if (updates.description !== undefined) updateData.description = updates.description

    // Contacto
    if (updates.contact_email !== undefined) updateData.contact_email = updates.contact_email
    if (updates.contact_phone !== undefined) updateData.contact_phone = updates.contact_phone
    if (updates.website_url !== undefined) updateData.website_url = updates.website_url

    // Branding
    if (updates.logo_url !== undefined) updateData.logo_url = updates.logo_url
    if (updates.brand_logo_url !== undefined) updateData.brand_logo_url = updates.brand_logo_url
    if (updates.brand_banner_url !== undefined) updateData.brand_banner_url = updates.brand_banner_url
    if (updates.brand_favicon_url !== undefined) updateData.brand_favicon_url = updates.brand_favicon_url
    if (updates.brand_color_primary !== undefined) updateData.brand_color_primary = updates.brand_color_primary
    if (updates.brand_color_secondary !== undefined) updateData.brand_color_secondary = updates.brand_color_secondary
    if (updates.brand_color_accent !== undefined) updateData.brand_color_accent = updates.brand_color_accent
    if (updates.brand_font_family !== undefined) updateData.brand_font_family = updates.brand_font_family

    // Suscripción
    if (updates.is_active !== undefined) updateData.is_active = updates.is_active
    if (updates.subscription_status !== undefined) updateData.subscription_status = updates.subscription_status
    if (updates.subscription_plan !== undefined) updateData.subscription_plan = updates.subscription_plan
    if (updates.max_users !== undefined) updateData.max_users = updates.max_users
    if (updates.google_login_enabled !== undefined) updateData.google_login_enabled = updates.google_login_enabled
    if (updates.microsoft_login_enabled !== undefined) updateData.microsoft_login_enabled = updates.microsoft_login_enabled

    if (Object.keys(updateData).length === 1) {
      throw new Error('No hay campos para actualizar')
    }

    // Check if this is a pending company being activated
    // We need to know the current state before updating
    let wasPendingActivation = false
    if (updates.is_active === true) {
      const { data: currentOrg } = await supabase
        .from('organizations')
        .select('is_active, subscription_status')
        .eq('id', id)
        .single()

      if (currentOrg && !currentOrg.is_active && currentOrg.subscription_status === 'pending') {
        wasPendingActivation = true
        // Also set subscription_status to 'active' if not explicitly set
        if (!updates.subscription_status) {
          updateData.subscription_status = 'active'
        }
      }
    }

    const { error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', id)

    if (error) {
      logger.error('❌ Error updating organization:', error)
      throw error
    }

    // If a pending company was just activated, promote the owner's cargo_rol
    if (wasPendingActivation) {
      const { data: ownerMembership } = await supabase
        .from('organization_users')
        .select('user_id')
        .eq('organization_id', id)
        .eq('role', 'owner')
        .maybeSingle()

      if (ownerMembership) {
        const { error: roleError } = await supabase
          .from('users')
          .update({ cargo_rol: 'Business' })
          .eq('id', ownerMembership.user_id)
          .eq('cargo_rol', 'Usuario')

        if (roleError) {
          logger.error('Error promoting owner cargo_rol:', roleError)
        } else {
          logger.info('Owner cargo_rol promoted to Business', {
            userId: ownerMembership.user_id,
            organizationId: id,
          })
        }
      }
    }

    const updatedCompany = await this.getCompanyById(id)

    if (!updatedCompany) {
      throw new Error('Organización no encontrada después de actualizar')
    }

    return updatedCompany
  }

  static async createCompany(data: {
    name: string
    slug?: string
    description?: string
    contact_email?: string
    contact_phone?: string
    website_url?: string
    subscription_plan?: string
    subscription_status?: string
    max_users?: number
    is_active?: boolean
    // Branding
    brand_logo_url?: string
    brand_banner_url?: string
    brand_favicon_url?: string
    brand_color_primary?: string
    brand_color_secondary?: string
    brand_color_accent?: string
    brand_font_family?: string
    google_login_enabled?: boolean
    microsoft_login_enabled?: boolean
    // Owner
    owner_email?: string
    owner_position?: string
  }): Promise<AdminCompany> {
    const supabase = await createClient()

    // Generate slug if not provided
    const slug = data.slug || data.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Check if slug already exists
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (existingOrg) {
      throw new Error('Ya existe una organización con este slug')
    }

    const insertData = {
      name: data.name,
      slug,
      description: data.description || null,
      contact_email: data.contact_email || null,
      contact_phone: data.contact_phone || null,
      website_url: data.website_url || null,
      subscription_plan: data.subscription_plan || 'team',
      subscription_status: data.subscription_status || 'active',
      max_users: data.max_users || 10,
      is_active: data.is_active !== false,
      // Branding
      brand_logo_url: data.brand_logo_url || null,
      brand_banner_url: data.brand_banner_url || null,
      brand_favicon_url: data.brand_favicon_url || null,
      brand_color_primary: data.brand_color_primary || '#3b82f6',
      brand_color_secondary: data.brand_color_secondary || '#10b981',
      brand_color_accent: data.brand_color_accent || '#8b5cf6',
      brand_font_family: data.brand_font_family || 'Inter',
      google_login_enabled: data.google_login_enabled ?? false,
      microsoft_login_enabled: data.microsoft_login_enabled ?? false
    }

    const { data: newOrg, error } = await supabase
      .from('organizations')
      .insert(insertData)
      .select('id')
      .single()

    if (error) {
      logger.error('❌ Error creating organization:', error)
      throw error
    }

    // Invite owner if email provided
    if (data.owner_email) {
      try {
        const { inviteUserAction } = await import('@/features/auth/actions/invitation')
        await inviteUserAction({
          email: data.owner_email,
          role: 'owner',
          organizationId: newOrg.id,
          position: data.owner_position || undefined
        })
        logger.info('✅ Owner invitation sent:', { email: data.owner_email, organizationId: newOrg.id })
      } catch (inviteError) {
        logger.error('Error inviting owner after company creation:', inviteError)
        // No fallamos la creación de la empresa si falla la invitación, pero lo loggeamos
      }
    }

    const createdCompany = await this.getCompanyById(newOrg.id)

    if (!createdCompany) {
      throw new Error('Error al obtener la organización creada')
    }

    return createdCompany
  }

  static async getCompanyCourses(id: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('hierarchy_course_assignments')
      .select(`
        id,
        course_id,
        assigned_at,
        due_date,
        status,
        courses (
          id,
          title,
          slug,
          thumbnail_url,
          category,
          level
        )
      `)
      .eq('organization_id', id)

    if (error) {
      logger.error('❌ Error fetching company courses:', error)
      throw error
    }

    return data || []
  }

  static async assignCourseToCompany(companyId: string, courseId: string, adminId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('hierarchy_course_assignments')
      .insert({
        organization_id: companyId,
        course_id: courseId,
        assigned_by: adminId,
        status: 'active'
      })
      .select()
      .single()

    if (error) {
      logger.error('❌ Error assigning course to company:', error)
      throw error
    }

    return data
  }

  static async removeCourseFromCompany(companyId: string, courseId: string) {
    const supabase = await createClient()

    const { error } = await supabase
      .from('hierarchy_course_assignments')
      .delete()
      .eq('organization_id', companyId)
      .eq('course_id', courseId)

    if (error) {
      logger.error('❌ Error removing course from company:', error)
      throw error
    }

    return { success: true }
  }

  // ─── INDIVIDUAL ASSIGNMENTS (Phase 3 Refinement) ───────────────────────────

  static async getUserCourseAssignments(companyId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('organization_course_assignments')
      .select(`
        id,
        user_id,
        course_id,
        assigned_at,
        status,
        completion_percentage,
        courses (
          id,
          title,
          slug,
          thumbnail_url
        ),
        users:user_id (
          id,
          email,
          first_name,
          last_name,
          display_name
        )
      `)
      .eq('organization_id', companyId)

    if (error) {
      logger.error('❌ Error fetching user course assignments:', error)
      throw error
    }

    return data || []
  }

  static async assignCourseToUser(companyId: string, userId: string, courseId: string, adminId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('organization_course_assignments')
      .insert({
        organization_id: companyId,
        user_id: userId,
        course_id: courseId,
        assigned_by: adminId,
        status: 'assigned'
      })
      .select()
      .single()

    if (error) {
      logger.error('❌ Error assigning course to user:', error)
      throw error
    }

    return data
  }

  static async removeCourseFromUser(assignmentId: string) {
    const supabase = await createClient()

    const { error } = await supabase
      .from('organization_course_assignments')
      .delete()
      .eq('id', assignmentId)

    if (error) {
      logger.error('❌ Error removing user course assignment:', error)
      throw error
    }

    return { success: true }
  }

  static async getCompanyDetailedStats(companyId: string) {
    const supabase = await createClient()

    // 1. Overview Metrics & Monthly Activity (Last 6 Months)
    const [assignmentsRes, sessionsRes, membersRes, pendingInvRes] = await Promise.all([
      supabase
        .from('organization_course_assignments')
        .select('course_id, completion_percentage, status, courses(title)')
        .eq('organization_id', companyId),
      supabase
        .from('study_sessions')
        .select('actual_duration_minutes, completed_at, status, self_evaluation')
        .eq('organization_id', companyId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: true }),
      supabase
        .from('organization_users')
        .select('status, job_title, region_id, zone_id, team_id, organization_teams(name)')
        .eq('organization_id', companyId),
      supabase
        .from('user_invitations')
        .select('id', { count: 'exact' })
        .eq('organization_id', companyId)
        .eq('status', 'pending')
    ])

    const assignments = assignmentsRes.data || []
    const sessions = sessionsRes.data || []
    const members = membersRes.data || []
    const pendingInvCount = pendingInvRes.count || 0

    const distinctCourses = new Set(assignments.map((a: any) => a.course_id)).size
    const totalLearningMinutes = sessions.reduce((acc: number, s: any) => acc + (s.actual_duration_minutes || 0), 0)
    
    const activeUsers = members.filter((m: any) => m.status === 'active').length
    const invitedUsersInOrg = members.filter((m: any) => m.status === 'invited').length
    const suspendedUsers = members.filter((m: any) => m.status === 'suspended').length
    const totalInvited = invitedUsersInOrg + pendingInvCount
    const totalUsers = members.length

    // 2. Prepare Monthly Activity (last 6 months) - FIX: Don't mutate the same Date object
    const monthlyData: Record<string, { month: string; hours: number; sessions: number }> = {}
    const monthsOrder: string[] = []
    
    for (let i = 5; i >= 0; i--) {
        const d = new Date()
        d.setMonth(d.getMonth() - i) // Corrected: Use setMonth on a new instance
        const key = d.toLocaleString('es-MX', { month: 'short' }).replace('.', '').toUpperCase()
        monthlyData[key] = { month: key, hours: 0, sessions: 0 }
        monthsOrder.push(key)
    }

    sessions.forEach((s: any) => {
        if (!s.completed_at) return
        const date = new Date(s.completed_at)
        const key = date.toLocaleString('es-MX', { month: 'short' }).replace('.', '').toUpperCase()
        if (monthlyData[key]) {
            monthlyData[key].hours += (s.actual_duration_minutes || 0) / 60
            monthlyData[key].sessions += 1
        }
    })

    // 3. Course Progress Breakdown
    const courseStatsMap: Record<string, { title: string; totalProgress: number; count: number; completed: number }> = {}
    
    assignments.forEach((a: any) => {
        const title = a.courses?.title || 'Curso sin título'
        if (!courseStatsMap[a.course_id]) {
            courseStatsMap[a.course_id] = { title, totalProgress: 0, count: 0, completed: 0 }
        }
        courseStatsMap[a.course_id].totalProgress += a.completion_percentage || 0
        courseStatsMap[a.course_id].count += 1
        if (a.status === 'completed') courseStatsMap[a.course_id].completed += 1
    })

    // 4. Team Distribution
    const teamStatsMap: Record<string, number> = {}
    members.forEach((m: any) => {
        const teamName = m.organization_teams?.name || 'Sin Equipo'
        teamStatsMap[teamName] = (teamStatsMap[teamName] || 0) + 1
    })

    // 5. Satisfaction (Avg self_evaluation)
    const ratedSessions = sessions.filter((s: any) => s.self_evaluation != null)
    const avgSatisfaction = ratedSessions.length > 0 
        ? ratedSessions.reduce((acc: number, s: any) => acc + s.self_evaluation, 0) / ratedSessions.length 
        : 0

    // 6. Recent Engagement (started in last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const recentlyActiveUsersCount = new Set(
        sessions
            .filter((s: any) => s.completed_at && new Date(s.completed_at) >= sevenDaysAgo)
            .map((s: any) => s.user_id)
    ).size

    return {
        overview: {
            totalUsers,
            activeUsers,
            invitedUsers: totalInvited,
            assignedCourses: distinctCourses,
            totalLearningHours: Math.round(totalLearningMinutes / 60),
            totalSessions: sessions.length,
            engagementRate: totalUsers > 0 ? Math.round((recentlyActiveUsersCount / totalUsers) * 100) : 0,
            avgSatisfaction: Math.round(avgSatisfaction * 10) / 10
        },
        activityMonthly: monthsOrder.map(key => ({
            ...monthlyData[key],
            hours: Math.round(monthlyData[key].hours * 10) / 10
        })),
        courseProgress: Object.entries(courseStatsMap).map(([id, stats]) => ({
            id,
            title: stats.title,
            averageProgress: stats.count > 0 ? Math.round(stats.totalProgress / stats.count) : 0,
            enrolledCount: stats.count,
            completedCount: stats.completed
        })).sort((a, b) => b.enrolledCount - a.enrolledCount).slice(0, 5),
        teamDistribution: Object.entries(teamStatsMap).map(([name, value]) => ({
            name,
            value
        })).sort((a, b) => b.value - a.value)
    }
  }
}

