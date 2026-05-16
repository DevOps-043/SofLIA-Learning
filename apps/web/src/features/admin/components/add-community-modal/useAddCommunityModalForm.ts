'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  buildAddCommunityPayload,
  buildCommunitySlug,
  createDefaultAddCommunityFormData,
  normalizeCommunityCourses,
  validateAddCommunityForm,
} from './add-community-modal.service'
import type { AddCommunityModalProps } from './types'
import type {
  AddCommunityCourseOption,
  AddCommunityFormData,
  AddCommunityFormErrors,
} from './types'

interface UseAddCommunityModalFormOptions
  extends Pick<AddCommunityModalProps, 'isOpen' | 'onClose' | 'onSave'> {}

export function useAddCommunityModalForm({
  isOpen,
  onClose,
  onSave,
}: UseAddCommunityModalFormOptions) {
  const { t } = useTranslation('admin')
  const [formData, setFormData] = useState<AddCommunityFormData>(
    createDefaultAddCommunityFormData(),
  )
  const [errors, setErrors] = useState<AddCommunityFormErrors>({})
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingCourses, setIsLoadingCourses] = useState(false)
  const [courses, setCourses] = useState<AddCommunityCourseOption[]>([])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setFormData(createDefaultAddCommunityFormData())
    setErrors({})
    setError(null)
    void loadCourses()
  }, [isOpen])

  const loadCourses = async () => {
    setIsLoadingCourses(true)

    try {
      const response = await fetch('/api/admin/courses')
      const data = await response.json()
      setCourses(normalizeCommunityCourses(data?.courses))
    } catch {
      setCourses([])
    } finally {
      setIsLoadingCourses(false)
    }
  }

  const setFieldValue = <K extends keyof AddCommunityFormData>(
    field: K,
    value: AddCommunityFormData[K],
  ) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
      ...(field === 'name'
        ? { slug: buildCommunitySlug(String(value)) }
        : {}),
    }))

    setErrors((previous) => ({
      ...previous,
      [field]: '',
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors = validateAddCommunityForm(formData, {
      descriptionRequired: t('communities.form.validation.descriptionRequired'),
      nameRequired: t('communities.form.validation.nameRequired'),
      slugInvalid: t('communities.form.validation.slugInvalid'),
      slugRequired: t('communities.form.validation.slugRequired'),
    })
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await onSave(buildAddCommunityPayload(formData))
      onClose()
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : t('communities.createModal.errorFallback'),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    formData,
    errors,
    error,
    courses,
    isSubmitting,
    isLoadingCourses,
    setFieldValue,
    handleSubmit,
  }
}
