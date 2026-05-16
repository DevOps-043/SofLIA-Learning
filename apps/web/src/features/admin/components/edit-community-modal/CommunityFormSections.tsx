'use client'

import { AdminCommunityFormSections } from '../admin-communities'
import type { AdminCommunityFormErrors } from '../admin-communities'
import type { CommunityFormData } from './useEditCommunityFormState'

interface CommunityFormSectionsProps {
  errors?: AdminCommunityFormErrors
  formData: CommunityFormData
  isDisabled?: boolean
  onFieldChange: <K extends keyof CommunityFormData>(
    field: K,
    value: CommunityFormData[K],
  ) => void
}

export function CommunityFormSections({
  errors,
  formData,
  isDisabled,
  onFieldChange,
}: CommunityFormSectionsProps) {
  return (
    <AdminCommunityFormSections
      errors={errors}
      formData={formData}
      isDisabled={isDisabled}
      onFieldChange={onFieldChange}
    />
  )
}
