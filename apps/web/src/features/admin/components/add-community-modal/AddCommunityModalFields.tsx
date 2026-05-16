'use client'

import { AdminCommunityFormSections } from '../admin-communities/AdminCommunityFormSections'
import type {
  AddCommunityCourseOption,
  AddCommunityFormData,
  AddCommunityFormErrors,
} from './types'

interface AddCommunityModalFieldsProps {
  courses: AddCommunityCourseOption[]
  errors: AddCommunityFormErrors
  formData: AddCommunityFormData
  isLoadingCourses: boolean
  isSubmitting: boolean
  onFieldChange: <K extends keyof AddCommunityFormData>(
    field: K,
    value: AddCommunityFormData[K],
  ) => void
}

export function AddCommunityModalFields({
  courses,
  errors,
  formData,
  isLoadingCourses,
  isSubmitting,
  onFieldChange,
}: AddCommunityModalFieldsProps) {
  return (
    <AdminCommunityFormSections
      courses={courses}
      errors={errors}
      formData={formData}
      isDisabled={isSubmitting}
      isLoadingCourses={isLoadingCourses}
      onFieldChange={onFieldChange}
      showCourseField
    />
  )
}
