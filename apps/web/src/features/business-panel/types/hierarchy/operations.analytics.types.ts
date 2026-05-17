export interface HierarchyStats {
  hierarchy_enabled: boolean;
  regions_count: number;
  teams_count: number;
  users_assigned: number;
  users_unassigned: number;
  zones_count: number;
}

export interface HierarchyRankingItem {
  completion_rate: number;
  hours: number;
  id: string;
  name: string;
  participation_rate: number;
}

export interface HierarchyTopPerformer {
  avatar?: string;
  completion_rate?: number;
  courses_completed?: number;
  id: string;
  label: string;
  name: string;
  value: number;
}

export interface HierarchyAnalytics {
  active_learners: number;
  active_teams?: number;
  active_zones?: number;
  assignment_completion_rate?: number;
  assignments_due_soon?: number;
  assignments_overdue?: number;
  avg_active_days?: number;
  avg_completion: number;
  avg_hours_per_member?: number;
  avg_hours_per_team?: number;
  avg_hours_per_zone?: number;
  avg_session_duration?: number;
  avg_streak?: number;
  completion_rate?: number;
  courses_assigned?: number;
  courses_completed?: number;
  courses_in_progress?: number;
  courses_not_started?: number;
  inactive_teams?: number;
  inactive_users?: number;
  inactive_zones?: number;
  last_activity?: string;
  lessons_completed?: number;
  longest_streak?: number;
  participation_rate?: number;
  sessions_completed?: number;
  sessions_missed?: number;
  team_ranking?: HierarchyRankingItem[];
  top_performer: HierarchyTopPerformer | null;
  total_hours: number;
  total_teams?: number;
  total_zones?: number;
  users_count: number;
  zone_ranking?: HierarchyRankingItem[];
}

export interface HierarchyCourse {
  avg_progress: number;
  category: string;
  enrolled_count: number;
  id: string;
  status: string;
  thumbnail_url: string | null;
  title: string;
}

export interface HierarchyConfig {
  auto_assign_new_users?: boolean;
  default_region_id?: string;
  default_team_id?: string;
  default_zone_id?: string;
  hierarchy_enabled: boolean;
  labels?: {
    region?: string;
    team?: string;
    zone?: string;
  };
  require_team_assignment?: boolean;
}
