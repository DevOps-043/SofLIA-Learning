'use client'

import { useState } from 'react'

export type TabType = 'basic' | 'personal' | 'additional'

export interface NewAdminUserData {
  username: string
  email: string
  password: string
  first_name: string
  last_name: string
  display_name: string
  cargo_rol: string
  type_rol: string
  phone: string
  bio: string
  location: string
  profile_picture_url: string
  curriculum_url: string
  linkedin_url: string
  github_url: string
  website_url: string
  points: number
  country_code: string
}

const INITIAL_FORM: NewAdminUserData = {
  username: '',
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  display_name: '',
  cargo_rol: 'Usuario',
  type_rol: '',
  phone: '',
  bio: '',
  location: '',
  profile_picture_url: '',
  curriculum_url: '',
  linkedin_url: '',
  github_url: '',
  website_url: '',
  points: 0,
  country_code: ''
}

interface UseAddUserFormStateProps {
  onSave: (userData: NewAdminUserData) => Promise<void>
  onClose: () => void
}

export function useAddUserFormState({ onSave, onClose }: UseAddUserFormStateProps) {
  const [formData, setFormData] = useState<NewAdminUserData>(INITIAL_FORM)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('basic')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
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
      setFormData(INITIAL_FORM)
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
    handleSubmit
  }
}
