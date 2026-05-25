export interface AnalyticsTeamStats {
  average_progress: number
  courses_completed: number
  total_assignments: number
  total_time_hours: number
  active_members: number
}

export interface AnalyticsTeam {
  team_id: string
  name: string
  description: string | null
  image_url: string | null
  member_count: number
  stats: AnalyticsTeamStats
}

export interface AnalyticsTeamsData {
  total_teams: number
  teams: AnalyticsTeam[]
  ranking: AnalyticsTeam[]
}
