'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  fetchInstructorOptions,
  INITIAL_ADD_WORKSHOP_FORM,
  type AddWorkshopFormData,
  type InstructorOption,
} from './add-workshop-form.service'
import { useAddWorkshopFormHandlers } from './useAddWorkshopFormHandlers'

interface UseAddWorkshopFormStateProps {
  isOpen: boolean
  onSave: () => Promise<void>
  onClose: () => void
}

export function useAddWorkshopFormState({
  isOpen,
  onSave,
  onClose,
}: UseAddWorkshopFormStateProps) {
  const { t } = useTranslation('admin')
  const [formData, setFormData] = useState<AddWorkshopFormData>(INITIAL_ADD_WORKSHOP_FORM)
  const [instructors, setInstructors] = useState<InstructorOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState<'basic' | 'details' | 'media'>('basic')

  useEffect(() => {
    if (isOpen) {
      setFormData(INITIAL_ADD_WORKSHOP_FORM)
      setErrors({})
      setError(null)
      setActiveTab('basic')
      void loadInstructors()
    }
  }, [isOpen])

  const { handleChange, handleSubmit } = useAddWorkshopFormHandlers({
    formData,
    onClose,
    onSave,
    setError,
    setErrors,
    setFormData,
    setIsLoading,
    t,
  })

  const loadInstructors = async () => {
    setInstructors(await fetchInstructorOptions())
  }

  return {
    formData,
    setFormData,
    instructors,
    isLoading,
    error,
    errors,
    activeTab,
    setActiveTab,
    handleChange,
    handleSubmit,
  }
}
