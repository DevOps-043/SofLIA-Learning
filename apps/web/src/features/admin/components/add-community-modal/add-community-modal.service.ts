import type { AdminCommunityMutationInput } from '../admin-communities/shared'
import type {
  AddCommunityCourseOption,
  AddCommunityFormData,
  AddCommunityFormErrors,
} from './types'

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
  formData: AddCommunityFormData,
): AddCommunityFormErrors {
  const errors: AddCommunityFormErrors = {}

  if (!formData.name.trim()) {
    errors.name = 'El nombre es requerido'
  }

  if (!formData.description.trim()) {
    errors.description = 'La descripcion es requerida'
  }

  if (!formData.slug.trim()) {
    errors.slug = 'El slug es requerido'
  } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
    errors.slug = 'Solo letras minusculas, numeros y guiones'
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
