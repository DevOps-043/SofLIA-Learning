import type { AdminCommunityMutationInput } from '../admin-communities/shared'
import type {
  AddCommunityCourseOption,
  AddCommunityFormData,
  AddCommunityFormErrors,
} from './types'

export interface CommunityValidationMessages {
  descriptionRequired: string
  nameRequired: string
  slugInvalid: string
  slugRequired: string
}

type CommunityValidationData = Pick<
  AddCommunityFormData,
  'description' | 'name' | 'slug'
>

export function createDefaultAddCommunityFormData(): AddCommunityFormData {
  return {
    name: '',
    description: '',
    slug: '',
    image_url: '',
    is_active: true,
    visibility: 'public',
    access_type: 'open',
    course_id: '',
  }
}

export function buildCommunitySlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function validateAddCommunityForm(
  formData: CommunityValidationData,
  messages: CommunityValidationMessages,
): AddCommunityFormErrors {
  const errors: AddCommunityFormErrors = {}

  if (!formData.name.trim()) {
    errors.name = messages.nameRequired
  }

  if (!formData.description.trim()) {
    errors.description = messages.descriptionRequired
  }

  if (!formData.slug.trim()) {
    errors.slug = messages.slugRequired
  } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
    errors.slug = messages.slugInvalid
  }

  return errors
}

export function normalizeCommunityCourses(
  courses: unknown,
): AddCommunityCourseOption[] {
  if (!Array.isArray(courses)) {
    return []
  }

  return courses.flatMap((course) => {
    if (!course || typeof course !== 'object') {
      return []
    }

    const value = course as Record<string, unknown>
    const id = typeof value.id === 'string' ? value.id : ''
    const title = typeof value.title === 'string' ? value.title : ''

    if (!id || !title) {
      return []
    }

    return [
      {
        id,
        title,
        instructor_name:
          typeof value.instructor_name === 'string'
            ? value.instructor_name
            : null,
      },
    ]
  })
}

export function buildAddCommunityPayload(
  formData: AddCommunityFormData,
): AdminCommunityMutationInput {
  return {
    name: formData.name.trim(),
    description: formData.description.trim(),
    slug: formData.slug.trim(),
    image_url: formData.image_url.trim() || null,
    is_active: formData.is_active,
    visibility: formData.visibility,
    access_type: formData.access_type,
    course_id: formData.course_id || null,
  }
}
