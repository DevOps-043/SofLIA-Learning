'use client'

import { useState } from 'react'

import { INITIAL_ADD_USER_FORM } from './add-user-form-state.constants'
import type { NewAdminUserData, TabType } from './add-user-form-state.types'

export type { NewAdminUserData, TabType } from './add-user-form-state.types'

interface UseAddUserFormStateProps {
  onSave: (userData: NewAdminUserData) => Promise<void>
  onClose: () => void
}

export function useAddUserFormState({ onSave, onClose }: UseAddUserFormStateProps) {
  const [formData, setFormData] = useState<NewAdminUserData>(INITIAL_ADD_USER_FORM)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('basic')

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (formData.password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      setIsLoading(false)
      return
    }

    try {
      await onSave(formData)
      setFormData(INITIAL_ADD_USER_FORM)
      setConfirmPassword('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear usuario')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    formData,
    setFormData,
    confirmPassword,
    setConfirmPassword,
    isLoading,
    error,
    activeTab,
    setActiveTab,
    handleChange,
    handleSubmit,
  }
}
