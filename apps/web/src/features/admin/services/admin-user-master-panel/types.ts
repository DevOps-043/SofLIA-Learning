/**
 * Contratos del Panel Maestro de usuarios del superadmin.
 * El GET agregado devuelve todo lo que las pestañas de organizaciones,
 * cursos y rutas necesitan para pintar el estado actual del usuario.
 */

export interface MasterPanelMembership {
  membershipId: string
  organizationId: string
  organizationName: string
  role: string | null
  status: string | null
  jobTitle: string | null
  joinedAt: string | null
}

export interface MasterPanelCourseAssignment {
  id: string
  organizationId: string
  courseId: string
  courseTitle: string
  courseSlug: string | null
  courseThumbnailUrl: string | null
  status: string | null
  completionPercentage: number | null
  sourceLearningPathId: string | null
  assignedAt: string | null
}

export interface MasterPanelLearningPathAssignment {
  id: string
  organizationId: string
  learningPathId: string
  learningPathTitle: string
  status: string | null
  assignedAt: string | null
}

export interface UserMasterPanelData {
  memberships: MasterPanelMembership[]
  courseAssignments: MasterPanelCourseAssignment[]
  learningPathAssignments: MasterPanelLearningPathAssignment[]
}
