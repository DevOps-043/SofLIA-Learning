import type { OrganizationInfo, WorkTeam } from '../types/user-context.types'

interface OrganizationRow {
  id: string
  name: string
  slug: string | null
  logo_url: string | null
  subscription_plan: string | null
  max_users: number | null
}

export function mapOrganizationInfo(data: OrganizationRow): OrganizationInfo {
  return {
    id: data.id,
    name: data.name,
    slug: data.slug ?? undefined,
    logoUrl: data.logo_url ?? undefined,
    industry: undefined,
    size: data.max_users ? `${data.max_users} usuarios` : undefined,
    plan: data.subscription_plan ?? undefined,
  }
}

export function mapWorkTeam(item: {
  role: string | null
  status: string | null
  work_teams: unknown
}): WorkTeam {
  const team = item.work_teams as {
    team_id: string
    name: string
    description?: string
    course_id?: string
  }

  return {
    teamId: team.team_id,
    name: team.name,
    description: team.description ?? undefined,
    role: item.role as 'member' | 'leader' | 'co-leader',
    status: item.status as 'active' | 'inactive',
    courseId: team.course_id ?? undefined,
  }
}
