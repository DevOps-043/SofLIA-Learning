'use client'

import { useEffect, useState, type FormEvent } from 'react'
import type { AdminWorkshop } from '../../services/adminWorkshops.service'
import type { EditWorkshopTab } from './types'
import { getInitialEditWorkshopData, validateEditWorkshopForm } from './service'

export function useEditWorkshopModalState(
  workshop: AdminWorkshop | null,
  t: (key: string) => string,
  onClose: () => void,
  onSave: (data: Partial<AdminWorkshop>) => Promise<void>,
) {
  const [formData, setFormData] = useState<Partial<AdminWorkshop>>(getInitialEditWorkshopData(workshop))
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saveError, setSaveError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<EditWorkshopTab>('basic')

  useEffect(() => {
    setFormData(getInitialEditWorkshopData(workshop))
    setErrors({})
    setSaveError(null)
    setActiveTab('basic')
  }, [workshop])

  const handleInputChange = <K extends keyof AdminWorkshop>(field: K, value: AdminWorkshop[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (!errors[field]) return
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const nextErrors = validateEditWorkshopForm(formData, t)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    setLoading(true)
    setSaveError(null)
    try {
      const dataToSave = { ...formData }
      if (formData.approval_status !== 'rejected') dataToSave.rejection_reason = ''
      await onSave(dataToSave)
      onClose()
    } catch {
      setSaveError(t('workshops.editModal.saveError'))
    } finally {
      setLoading(false)
    }
  }

  return {
    formData,
    loading,
    errors,
    saveError,
    activeTab,
    setActiveTab,
    handleInputChange,
    handleSubmit,
  }
}
