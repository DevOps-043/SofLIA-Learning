import type { AdminUser } from '../../../services/adminUsers.service'
import type { UserGender } from '../../../../../lib/schemas/user-demographics.schema'
import type {
  MasterPanelCourseAssignment,
  MasterPanelLearningPathAssignment,
  MasterPanelMembership,
  UserMasterPanelData,
} from '../../../services/admin-user-master-panel/types'

export type {
  MasterPanelCourseAssignment,
  MasterPanelLearningPathAssignment,
  MasterPanelMembership,
  UserMasterPanelData,
}

export type MasterPanelTab =
  | 'profile'
  | 'account'
  | 'organizations'
  | 'courses'
  | 'learningPaths'
  | 'stats'

export const MASTER_PANEL_TABS: MasterPanelTab[] = [
  'profile',
  'account',
  'organizations',
  'courses',
  'learningPaths',
  'stats',
]

export type OrganizationRole = 'member' | 'admin' | 'owner'

export const ORGANIZATION_ROLES: OrganizationRole[] = ['member', 'admin', 'owner']

export interface UserMasterPanelProps {
  user: AdminUser
  isOpen: boolean
  initialTab?: MasterPanelTab
  /** Organización filtrada en la página: preselección en tabs org-scoped. */
  defaultOrganizationId?: string | null
  organizationLabel?: string | null
  onClose: () => void
  /** Refresca el directorio de usuarios tras guardar perfil/cuenta. */
  onUserSaved: () => Promise<void>
  /** Abre el flujo de eliminación existente (modal de borrado de la página). */
  onRequestDelete?: (user: AdminUser) => void
}

/** Datos personales editables (port del antiguo EditUserModal, sin `points`,
 * que el backend nunca aceptó y solo generaba una UI engañosa). */
export interface MasterPanelProfileFormData {
  username: string
  email: string
  first_name: string
  last_name: string
  display_name: string
  phone: string
  date_of_birth: string
  gender: UserGender | ''
  bio: string
  location: string
  profile_picture_url: string
  country_code: string
}

export interface MasterPanelAccountFormData {
  cargo_rol: string
  email_verified: boolean
}

/** Curso del catálogo de una organización (respuesta de /api/admin/companies/[id]/courses). */
export interface OrgCourseCatalogItem {
  courseId: string
  title: string
  category: string | null
}

/** Ruta del catálogo de una organización (respuesta de /api/admin/companies/[id]/learning-paths). */
export interface OrgLearningPathCatalogItem {
  learningPathId: string
  title: string
  itemCount: number
}

export interface ToastState {
  isOpen: boolean
  message: string
  type: 'success' | 'error' | 'info'
}

export type ShowToast = (message: string, type?: ToastState['type']) => void
