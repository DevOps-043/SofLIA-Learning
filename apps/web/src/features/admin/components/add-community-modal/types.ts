import type { AdminCommunityMutationInput } from '../admin-communities/shared'

export interface AddCommunityCourseOption {
  id: string
  title: string
  instructor_name?: string | null
}

export interface AddCommunityFormData {
  name: string
  description: string
  slug: string
  image_url: string
  is_active: boolean
  visibility: 'public' | 'private'
  access_type: 'open' | 'moderated' | 'invite_only'
  course_id: string
}

export type AddCommunityFormErrors = Partial<
  Record<keyof Pick<AddCommunityFormData, 'name' | 'description' | 'slug'>, string>
>

export interface AddCommunityModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (communityData: AdminCommunityMutationInput) => Promise<void>
}
