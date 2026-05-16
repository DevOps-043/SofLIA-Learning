import type { TFunction } from 'i18next'

export interface InstructorOption {
  id: string
  name: string
}

export const INITIAL_ADD_WORKSHOP_FORM = {
  title: '',
  description: '',
  category: 'ia',
  level: 'beginner',
  duration_total_minutes: 60,
  thumbnail_url: '',
  slug: '',
  price: 0,
  instructor_id: '',
  is_active: true,
  learning_objectives: [] as string[],
}

export type AddWorkshopFormData = typeof INITIAL_ADD_WORKSHOP_FORM

export function createWorkshopSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export async function fetchInstructorOptions() {
  try {
    const response = await fetch('/api/admin/instructors')
    const data = await response.json()
    if (data.success && data.instructors) {
      return (data.instructors as InstructorOption[]).map((instructor) => ({
        id: instructor.id,
        name: instructor.name,
      }))
    }
  } catch {}

  return []
}

export function validateAddWorkshopForm(
  formData: AddWorkshopFormData,
  t: TFunction<'admin'>,
) {
  const errors: Record<string, string> = {}

  if (!formData.title.trim()) {
    errors.title = t('workshops.addModal.validation.titleRequired')
  }
  if (!formData.description.trim()) {
    errors.description = t('workshops.addModal.validation.descriptionRequired')
  }
  if (!formData.slug.trim()) {
    errors.slug = t('workshops.addModal.validation.slugRequired')
  }
  if (!formData.instructor_id) {
    errors.instructor_id = t('workshops.addModal.validation.instructorRequired')
  }
  if (formData.duration_total_minutes <= 0) {
    errors.duration_total_minutes = t('workshops.addModal.validation.durationRequired')
  }

  return errors
}

export async function submitAddWorkshopForm(
  formData: AddWorkshopFormData,
  t: TFunction<'admin'>,
) {
  const response = await fetch('/api/admin/workshops/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  })
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || data.message || t('workshops.addModal.errorCreate'))
  }
}
