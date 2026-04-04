'use client'

import { useState, useEffect, useRef } from 'react'
import type { BusinessUser } from '../../services/businessUsers.service'

export interface UserFormData {
  first_name: string
  last_name: string
  display_name: string
  email: string
  cargo_rol: string
  job_title: string
  org_role: 'owner' | 'admin' | 'member'
  org_status: 'active' | 'invited' | 'suspended' | 'removed'
  profile_picture_url: string
  bio: string
  location: string
  phone: string
}

export function useUserFormState(
  user: BusinessUser | null,
  onSave: (userId: string, data: UserFormData) => Promise<void>,
  onClose: () => void,
) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<UserFormData>({
    first_name: '',
    last_name: '',
    display_name: '',
    email: '',
    cargo_rol: '',
    job_title: '',
    org_role: 'member',
    org_status: 'active',
    profile_picture_url: '',
    bio: '',
    location: '',
    phone: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        display_name: user.display_name || '',
        email: user.email || '',
        cargo_rol: user.cargo_rol || '',
        job_title: user.job_title || '',
        org_role: user.org_role || 'member',
        org_status: user.org_status || 'active',
        profile_picture_url: user.profile_picture_url || '',
        bio: user.bio || '',
        location: user.location || '',
        phone: user.phone || '',
      })
      setPreviewImage(user.profile_picture_url || null)
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setError('Tipo de archivo no válido. Solo se permiten PNG, JPEG, JPG y GIF.')
      return
    }

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setError('El archivo es demasiado grande. Máximo 10MB.')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => { setPreviewImage(reader.result as string) }
    reader.readAsDataURL(file)

    try {
      setIsUploadingImage(true)
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)

      const response = await fetch('/api/profile/upload-picture', {
        method: 'POST',
        body: formDataUpload,
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al subir imagen')
      }

      const { imageUrl } = await response.json()
      setFormData(prev => ({ ...prev, profile_picture_url: imageUrl }))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir imagen')
      setPreviewImage(user?.profile_picture_url || null)
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    setError(null)
    try {
      await onSave(user.id, formData)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar usuario')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    fileInputRef,
    formData,
    setFormData,
    isLoading,
    isUploadingImage,
    error,
    previewImage,
    handleChange,
    handleImageChange,
    handleSubmit,
  }
}
