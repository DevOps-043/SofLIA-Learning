import { useEffect, useState } from 'react'
import type { AdminUser } from '../../services/adminUsers.service'
import { createEditUserFormData, updateEditUserField } from './service'
import type { EditUserFormData, TabType } from './types'

export function useEditUserModalForm(user: AdminUser | null) {
  const [formData, setFormData] = useState<EditUserFormData>(
    createEditUserFormData(),
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('personal')

  useEffect(() => {
    setFormData(createEditUserFormData(user))
  }, [user])

  const handleFieldChange = (
    name: keyof EditUserFormData,
    value: string | boolean,
    inputType?: string,
  ) => {
    setFormData((current) => updateEditUserField(current, name, value, inputType))
  }

  return {
    formData,
    isLoading,
    error,
    activeTab,
    setIsLoading,
    setError,
    setActiveTab,
    handleFieldChange,
  }
}
