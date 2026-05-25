import type {
  AdminCompany,
  LearningPath,
  LearningPathAssignmentOverview,
  LearningPathOrganizationAssignmentSummary,
  LearningPathUserAssignmentSummary,
} from '../../types'

export interface CourseOption {
  id: string
  title: string
}

export type Translate = (key: string, fallback: string) => string

export interface UseLearningPathManagementProps {
  learningPathId: string
}

export interface LearningPathManagementState {
  allCourses: CourseOption[]
  assignmentOverview: LearningPathAssignmentOverview
  companies: AdminCompany[]
  error: string | null
  learningPath: LearningPath | null
  loading: boolean
  organizationAssignmentToRevoke: LearningPathOrganizationAssignmentSummary | null
  removeTargetId: string | null
  saving: boolean
  selectedCourseId: string
  selectedOrganizationId: string
  selectedUserId: string
  selectedUserOrganizationId: string
  userAssignmentToRevoke: LearningPathUserAssignmentSummary | null
}
