import { SOFLIA_ADMIN_COLORS } from '../../constants/admin-color-tokens'

export const adminCommunitiesColors = SOFLIA_ADMIN_COLORS

export type AdminCommunitiesViewMode = 'grid' | 'list'

export interface AdminCommunityMutationInput {
  name?: string
  description?: string
  slug?: string
  image_url?: string | null
  is_active?: boolean
  visibility?: string
  access_type?: string
  course_id?: string | null
}
