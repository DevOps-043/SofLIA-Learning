import type {
  AdminCommunityCourseOption,
  AdminCommunityFormErrors,
  AdminCommunityFormValues,
} from '../admin-communities/AdminCommunityFormSections'
import type { AdminCommunityMutationInput } from '../admin-communities/shared'

export type AddCommunityCourseOption = AdminCommunityCourseOption

export interface AddCommunityFormData extends AdminCommunityFormValues {
  course_id: string
}

export type AddCommunityFormErrors = AdminCommunityFormErrors

export interface AddCommunityModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (communityData: AdminCommunityMutationInput) => Promise<void>
}
