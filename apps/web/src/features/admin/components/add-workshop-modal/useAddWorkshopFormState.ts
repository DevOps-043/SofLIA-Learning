'use client'

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

interface InstructorOption {
  id: string
  name: string
}

const INITIAL_FORM = {
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

type FormData = typeof INITIAL_FORM

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
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM)
  const [instructors, setInstructors] = useState<InstructorOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] =
    useState<'basic' | 'details' | 'media'>('basic')

  useEffect(() => {
    if (isOpen) {
      setFormData(INITIAL_FORM)
      setErrors({})
      setError(null)
      setActiveTab('basic')
      fetchInstructors()
    }
  }, [isOpen])

  const fetchInstructors = async () => {
    try {
      const response = await fetch('/api/admin/instructors')
      const data = await response.json()
      if (data.success && data.instructors) {
        setInstructors(
          (data.instructors as InstructorOption[]).map((instructor) => ({
            id: instructor.id,
            name: instructor.name,
          })),
        )
      }
    } catch {
      setInstructors([])
    }
  }

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = event.target
    const checked = (event.target as HTMLInputElement).checked

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? checked
          : type === 'number'
            ? parseFloat(value) || 0
            : value,
    }))

    if (name === 'title') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      setFormData((prev) => ({ ...prev, slug }))
    }

    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = t('workshops.addModal.validation.titleRequired')
    }
    if (!formData.description.trim()) {
      newErrors.description = t(
        'workshops.addModal.validation.descriptionRequired',
      )
    }
    if (!formData.slug.trim()) {
      newErrors.slug = t('workshops.addModal.validation.slugRequired')
    }
    if (!formData.instructor_id) {
      newErrors.instructor_id = t(
        'workshops.addModal.validation.instructorRequired',
      )
    }
    if (formData.duration_total_minutes <= 0) {
      newErrors.duration_total_minutes = t(
        'workshops.addModal.validation.durationRequired',
      )
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/workshops/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          level: formData.level,
          duration_total_minutes: formData.duration_total_minutes,
          instructor_id: formData.instructor_id,
          is_active: formData.is_active,
          thumbnail_url: formData.thumbnail_url,
          slug: formData.slug,
          price: formData.price,
          learning_objectives: formData.learning_objectives,
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || data.message || t('workshops.addModal.errorCreate'),
        )
      }

      await new Promise((resolve) => setTimeout(resolve, 1000))
      await onSave()
      onClose()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('workshops.addModal.errorCreate'),
      )
    } finally {
      setIsLoading(false)
    }
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
