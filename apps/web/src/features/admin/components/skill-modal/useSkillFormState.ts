'use client'

import { useState, useEffect, useRef } from 'react'
import type {
  AdminSkill,
  CreateSkillData,
  UpdateSkillData
} from '../../services/adminSkills.service'
import { SkillLevel } from '@/features/skills/constants/skillLevels'

interface SkillBadgeRow {
  level?: string
  badge_url?: string
}

interface SkillBadgesResponse {
  success?: boolean
  badges?: SkillBadgeRow[]
}

interface SkillListResponse {
  skills?: AdminSkill[]
}

export const CATEGORIES = [
  'general', 'programming', 'design', 'marketing', 'business',
  'data', 'ai', 'cloud', 'security', 'devops', 'leadership', 'communication', 'other'
]

export const CATEGORY_LABELS: Record<string, string> = {
  general: 'General', programming: 'Programación', design: 'Diseño',
  marketing: 'Marketing', business: 'Negocios', data: 'Datos',
  ai: 'Inteligencia Artificial', cloud: 'Cloud Computing', security: 'Seguridad',
  devops: 'DevOps', leadership: 'Liderazgo', communication: 'Comunicación', other: 'Otros'
}

export const LEVELS = ['beginner', 'intermediate', 'advanced', 'expert', 'master']
export const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado',
  expert: 'Experto', master: 'Maestro'
}

interface UseSkillFormStateProps {
  skill: AdminSkill | null
  isOpen: boolean
  onSave: (skillData: CreateSkillData | UpdateSkillData) => Promise<void>
}

export function useSkillFormState({ skill, isOpen, onSave }: UseSkillFormStateProps) {
  const [formData, setFormData] = useState({
    name: '', slug: '', description: '', category: 'general',
    icon_url: '', icon_type: 'image', icon_name: '', level: 'beginner',
    is_active: true, is_featured: false, display_order: 0
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [badges, setBadges] = useState<Record<SkillLevel, string | null>>({
    green: null, bronze: null, silver: null, gold: null, diamond: null
  })
  const [loadingBadges, setLoadingBadges] = useState(false)
  const [iconPreview, setIconPreview] = useState<string | null>(null)
  const [uploadingIcon, setUploadingIcon] = useState(false)
  const iconFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (skill) {
      setFormData({
        name: skill.name || '', slug: skill.slug || '', description: skill.description || '',
        category: skill.category || 'general', icon_url: skill.icon_url || '',
        icon_type: skill.icon_type || 'image', icon_name: skill.icon_name || '',
        level: skill.level || 'beginner', is_active: skill.is_active !== false,
        is_featured: skill.is_featured || false, display_order: skill.display_order || 0
      })
      setIconPreview(skill.icon_url || null)
      loadBadges(skill.skill_id)
    } else {
      setFormData({
        name: '', slug: '', description: '', category: 'general',
        icon_url: '', icon_type: 'image', icon_name: '', level: 'beginner',
        is_active: true, is_featured: false, display_order: 0
      })
      setIconPreview(null)
      setBadges({ green: null, bronze: null, silver: null, gold: null, diamond: null })
    }
    setError(null)
  }, [skill, isOpen])

  const loadBadges = async (skillId: string) => {
    if (!skillId) return
    setLoadingBadges(true)
    try {
      const response = await fetch(`/api/admin/skills/${skillId}/badges`, { credentials: 'include' })
      if (response.ok) {
        const data: SkillBadgesResponse = await response.json()
        if (data.success && data.badges) {
          const badgesMap: Record<SkillLevel, string | null> = {
            green: null, bronze: null, silver: null, gold: null, diamond: null
          }
          data.badges.forEach((badge) => {
            if (badge.level && badgesMap.hasOwnProperty(badge.level)) {
              badgesMap[badge.level as SkillLevel] = badge.badge_url ?? null
            }
          })
          setBadges(badgesMap)
        }
      }
    } catch (error) {
      console.error('Error loading badges:', error)
    } finally {
      setLoadingBadges(false)
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: skill ? prev.slug : generateSlug(name)
    }))
  }

  const handleIconUpload = async (file: File) => {
    if (!formData.slug) {
      setError('Primero debes crear un slug para la skill')
      return
    }
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      setError('Solo se permiten archivos de imagen (PNG, JPEG, JPG, GIF, WebP, SVG)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('El archivo no puede ser mayor a 5MB')
      return
    }
    setUploadingIcon(true)
    setError(null)
    try {
      const previewUrl = URL.createObjectURL(file)
      setIconPreview(previewUrl)
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('skillSlug', formData.slug)
      const response = await fetch('/api/admin/upload/skill-icon', {
        method: 'POST', body: uploadFormData, credentials: 'include'
      })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || 'Error al subir el icono')
      setFormData(prev => ({ ...prev, icon_url: data.icon.url, icon_type: 'image' }))
    } catch (error) {
      setIconPreview(null)
      setError(error instanceof Error ? error.message : 'Error al subir el icono')
    } finally {
      setUploadingIcon(false)
    }
  }

  const handleBadgeChange = (level: SkillLevel, url: string | null) => {
    setBadges(prev => ({ ...prev, [level]: url }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!formData.name.trim()) { setError('El nombre es requerido'); return }
    if (!formData.slug.trim()) { setError('El slug es requerido'); return }
    if (!formData.icon_url || !formData.icon_url.trim()) {
      setError('El icono es requerido. Por favor sube una imagen.')
      return
    }
    try {
      setIsSaving(true)
      const skillDataToSave = { ...formData, icon_url: formData.icon_url.trim() || null }
      await onSave(skillDataToSave)
      if (!skill) {
        const pendingBadges = Object.entries(badges).filter(([_, url]) => url !== null) as [SkillLevel, string][]
        if (pendingBadges.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 500))
          try {
            const skillResponse = await fetch('/api/admin/skills', { credentials: 'include' })
            if (skillResponse.ok) {
              const skillData: SkillListResponse = await skillResponse.json()
              const savedSkill = skillData.skills?.find((s) => s.slug === formData.slug)
              if (savedSkill?.skill_id) {
                for (const [level, badgeUrl] of pendingBadges) {
                  try {
                    const createResponse = await fetch(`/api/admin/skills/${savedSkill.skill_id}/badges`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ level, badge_url: badgeUrl, storage_path: `${formData.slug}-${level}.png` })
                    })
                    if (!createResponse.ok) {
                      const errorData = await createResponse.json().catch(() => ({}))
                      console.error(`Error asociando badge ${level}:`, errorData.error || 'Error desconocido')
                    }
                  } catch (err) {
                    console.error(`Error asociando badge ${level}:`, err)
                  }
                }
              }
            }
          } catch (err) {
            console.error('Error buscando skill recién creada:', err)
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la skill')
    } finally {
      setIsSaving(false)
    }
  }

  return {
    formData, setFormData, isSaving, error, setError,
    badges, loadingBadges, iconPreview, setIconPreview,
    uploadingIcon, iconFileInputRef,
    handleNameChange, handleIconUpload, handleBadgeChange, handleSubmit
  }
}
