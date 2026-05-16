import type { ChangeEvent, Dispatch, FormEvent, SetStateAction } from 'react'
import type { TFunction } from 'i18next'
import {
  createWorkshopSlug,
  submitAddWorkshopForm,
  validateAddWorkshopForm,
  type AddWorkshopFormData,
} from './add-workshop-form.service'

interface UseAddWorkshopFormHandlersProps {
  formData: AddWorkshopFormData
  onClose: () => void
  onSave: () => Promise<void>
  setError: Dispatch<SetStateAction<string | null>>
  setErrors: Dispatch<SetStateAction<Record<string, string>>>
  setFormData: Dispatch<SetStateAction<AddWorkshopFormData>>
  setIsLoading: Dispatch<SetStateAction<boolean>>
  t: TFunction<'admin'>
}

export function useAddWorkshopFormHandlers({
  formData,
  onClose,
  onSave,
  setError,
  setErrors,
  setFormData,
  setIsLoading,
  t,
}: UseAddWorkshopFormHandlersProps) {
  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = event.target
    const checked = (event.target as HTMLInputElement).checked

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value,
      ...(name === 'title' ? { slug: createWorkshopSlug(value) } : {}),
    }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const nextErrors = validateAddWorkshopForm(formData, t)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsLoading(true)
    setError(null)

    try {
      await submitAddWorkshopForm(formData, t)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await onSave()
      onClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : t('workshops.addModal.errorCreate'))
    } finally {
      setIsLoading(false)
    }
  }

  return {
    handleChange,
    handleSubmit,
  }
}
