export interface LearningPathCourseSummary {
  id: string
  title: string
  slug: string | null
  thumbnail_url: string | null
  category: string | null
  level: string | null
}

export interface LearningPathItem {
  id: string
  learning_path_id: string
  course_id: string
  position: number
  course: LearningPathCourseSummary | null
}

export interface LearningPath {
  id: string
  title: string
  slug: string | null
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  items: LearningPathItem[]
  item_count: number
}

export interface OrganizationLearningPathAssignment {
  id: string
  organization_id: string
  learning_path_id: string
  assigned_at: string
  status: 'active' | 'revoked'
  learning_path: LearningPath | null
}

export interface UserLearningPathAssignment {
  id: string
  organization_id: string
  user_id: string
  learning_path_id: string
  assigned_at: string
  status: 'assigned' | 'revoked'
  learning_path: LearningPath | null
  user: {
    id: string
    email: string
    display_name: string | null
    first_name: string | null
    last_name: string | null
  } | null
}

export interface LearningPathOrganizationAssignmentSummary {
  id: string
  organization_id: string
  organization_name: string
  organization_slug: string | null
  assigned_at: string
  status: 'active' | 'revoked'
}

export interface LearningPathUserAssignmentSummary {
  id: string
  organization_id: string
  organization_name: string
  user_id: string
  assigned_at: string
  status: 'assigned' | 'revoked'
  user: {
    id: string
    email: string
    display_name: string | null
    first_name: string | null
    last_name: string | null
  } | null
}

export interface LearningPathAssignmentOverview {
  organizationAssignments: LearningPathOrganizationAssignmentSummary[]
  userAssignments: LearningPathUserAssignmentSummary[]
}

export interface LearningPathUpsertPayload {
  title: string
  slug?: string | null
  description?: string | null
  is_active?: boolean
}
