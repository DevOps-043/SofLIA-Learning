'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Upload, Image as ImageIcon, Loader2 } from 'lucide-react'
import {
  AdminSkill,
  CreateSkillData,
  UpdateSkillData
} from '../services/adminSkills.service'
import { SkillBadgeUpload } from './SkillBadgeUpload'
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

interface SkillModalProps {
  isOpen: boolean
  onClose: () => void
  skill: AdminSkill | null
  onSave: (skillData: CreateSkillData | UpdateSkillData) => Promise<void>
}

const CATEGORIES = [
  'general',
  'programming',
  'design',
  'marketing',
  'business',
  'data',
  'ai',
  'cloud',
  'security',
  'devops',
  'leadership',
  'communication',
  'other'
]

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  programming: 'Programación',
  design: 'Diseño',
  marketing: 'Marketing',
  business: 'Negocios',
  data: 'Datos',
  ai: 'Inteligencia Artificial',
  cloud: 'Cloud Computing',
  security: 'Seguridad',
  devops: 'DevOps',
  leadership: 'Liderazgo',
  communication: 'Comunicación',
  other: 'Otros'
}

const LEVELS = ['beginner', 'intermediate', 'advanced', 'expert', 'master']
const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
  expert: 'Experto',
  master: 'Maestro'
}

// Iconos solo por imagen (upload)

export function SkillModal({ isOpen, onClose, skill, onSave }: SkillModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    category: 'general',
    icon_url: '',
    icon_type: 'image',
    icon_name: '',
    level: 'beginner',
    is_active: true,
    is_featured: false,
    display_order: 0
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [badges, setBadges] = useState<Record<SkillLevel, string | null>>({
    green: null,
    bronze: null,
    silver: null,
    gold: null,
    diamond: null
  })
  const [loadingBadges, setLoadingBadges] = useState(false)
  const [iconPreview, setIconPreview] = useState<string | null>(null)
  const [uploadingIcon, setUploadingIcon] = useState(false)
  const iconFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (skill) {
      setFormData({
        name: skill.name || '',
        slug: skill.slug || '',
        description: skill.description || '',
        category: skill.category || 'general',
        icon_url: skill.icon_url || '',
        icon_type: skill.icon_type || 'image',
        icon_name: skill.icon_name || '',
        level: skill.level || 'beginner',
        is_active: skill.is_active !== false,
        is_featured: skill.is_featured || false,
        display_order: skill.display_order || 0
      })
      setIconPreview(skill.icon_url || null)
      
      // Cargar badges existentes
      loadBadges(skill.skill_id)
    } else {
      setFormData({
        name: '',
        slug: '',
        description: '',
        category: 'general',
        icon_url: '',
        icon_type: 'image',
        icon_name: '',
        level: 'beginner',
        is_active: true,
        is_featured: false,
        display_order: 0
      })
      setIconPreview(null)
      // Resetear badges
      setBadges({
        green: null,
        bronze: null,
        silver: null,
        gold: null,
        diamond: null
      })
    }
    setError(null)
  }, [skill, isOpen])

  const loadBadges = async (skillId: string) => {
    if (!skillId) return
    
    setLoadingBadges(true)
    try {
      const response = await fetch(`/api/admin/skills/${skillId}/badges`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data: SkillBadgesResponse = await response.json()
        if (data.success && data.badges) {
          // Mapear badges a nuestro formato
          const badgesMap: Record<SkillLevel, string | null> = {
            green: null,
            bronze: null,
            silver: null,
            gold: null,
            diamond: null
          }
          
          data.badges.forEach((badge) => {
            if (badge.level && badgesMap.hasOwnProperty(badge.level)) {
              badgesMap[badge.level as SkillLevel] = badge.badge_url
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

    // Validar tipo
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      setError('Solo se permiten archivos de imagen (PNG, JPEG, JPG, GIF, WebP, SVG)')
      return
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('El archivo no puede ser mayor a 5MB')
      return
    }

    setUploadingIcon(true)
    setError(null)

    try {
      // Crear preview local
      const previewUrl = URL.createObjectURL(file)
      setIconPreview(previewUrl)

      // Subir al servidor
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('skillSlug', formData.slug)

      const response = await fetch('/api/admin/upload/skill-icon', {
        method: 'POST',
        body: uploadFormData,
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al subir el icono')
      }

      // Actualizar el formData con la URL
      setFormData(prev => ({
        ...prev,
        icon_url: data.icon.url,
        icon_type: 'image'
      }))
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

    if (!formData.name.trim()) {
      setError('El nombre es requerido')
      return
    }

    if (!formData.slug.trim()) {
      setError('El slug es requerido')
      return
    }

    if (!formData.icon_url || !formData.icon_url.trim()) {
      setError('El icono es requerido. Por favor sube una imagen.')
      return
    }

    try {
      setIsSaving(true)
      // Asegurar que icon_url se envíe correctamente (null si está vacío)
      const skillDataToSave = {
        ...formData,
        icon_url: formData.icon_url.trim() || null
      }
      await onSave(skillDataToSave)
      
      // Si es una skill nueva y hay badges pendientes, asociarlos
      if (!skill) {
        const pendingBadges = Object.entries(badges).filter(([_, url]) => url !== null) as [SkillLevel, string][]
        
        if (pendingBadges.length > 0) {
          // Esperar un momento para que la skill se guarde en la BD
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Buscar la skill recién creada por slug
          try {
            const skillResponse = await fetch(`/api/admin/skills`, {
              credentials: 'include'
            })
            
            if (skillResponse.ok) {
              const skillData: SkillListResponse = await skillResponse.json()
              const savedSkill = skillData.skills?.find((savedSkillItem) => savedSkillItem.slug === formData.slug)
              
              if (savedSkill?.skill_id) {
                // Asociar cada badge pendiente
                for (const [level, badgeUrl] of pendingBadges) {
                  try {
                    // Crear registro en BD usando el endpoint de badges
                    const createResponse = await fetch(`/api/admin/skills/${savedSkill.skill_id}/badges`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      credentials: 'include',
                      body: JSON.stringify({
                        level,
                        badge_url: badgeUrl,
                        storage_path: `${formData.slug}-${level}.png`
                      })
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

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {skill ? 'Editar Skill' : 'Nueva Skill'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Slug *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categoría
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nivel
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {LEVELS.map(level => (
                    <option key={level} value={level}>{LEVEL_LABELS[level]}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Upload de Icono - Solo Imágenes */}
            {/* Upload de Icono - Solo Imágenes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Icono de la Skill *
              </label>
                
                {/* Preview o Upload */}
                {iconPreview || formData.icon_url ? (
                  <div className="space-y-3">
                    <div className="relative w-32 h-32 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <img
                        src={iconPreview || formData.icon_url}
                        alt="Icono de skill"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex gap-2">
                      <label className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer transition-colors">
                        <Upload className="w-4 h-4" />
                        {uploadingIcon ? 'Subiendo...' : 'Cambiar'}
                        <input
                          ref={iconFileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleIconUpload(file)
                          }}
                          disabled={uploadingIcon || !formData.slug}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={async () => {
                          // Si es una skill existente, eliminar del servidor
                          if (skill?.skill_id && formData.icon_url) {
                            try {
                              const response = await fetch(`/api/admin/skills/${skill.skill_id}/icon`, {
                                method: 'DELETE',
                                credentials: 'include'
                              })

                              const data = await response.json()

                              if (!response.ok || !data.success) {
                                throw new Error(data.error || 'Error al eliminar el icono')
                              }
                            } catch (error) {
                              setError(error instanceof Error ? error.message : 'Error al eliminar el icono')
                              return
                            }
                          }

                          // Limpiar estado local
                          setIconPreview(null)
                          setFormData(prev => ({ ...prev, icon_url: '' }))
                          if (iconFileInputRef.current) {
                            iconFileInputRef.current.value = ''
                          }
                        }}
                        className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                    {uploadingIcon && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Subiendo icono...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                      <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Sube una imagen para el icono de la skill
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                        Formatos: PNG, JPEG, JPG, GIF, WebP, SVG (máx. 5MB)
                      </p>
                      <label className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer transition-colors">
                        <Upload className="w-4 h-4" />
                        Subir Imagen
                        <input
                          ref={iconFileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleIconUpload(file)
                          }}
                          disabled={uploadingIcon || !formData.slug}
                        />
                      </label>
                      {!formData.slug && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                          ⚠️ Primero debes crear un slug para poder subir el icono
                        </p>
                      )}
                    </div>
                  </div>
                )}
            </div>

            {/* Upload de Badges por Nivel */}
            {formData.slug && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <SkillBadgeUpload
                  skillId={skill?.skill_id || null}
                  skillSlug={formData.slug}
                  badges={badges}
                  onBadgeChange={handleBadgeChange}
                  disabled={isSaving || loadingBadges || !formData.slug}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Orden de Visualización
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-end gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Activa</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Destacada</span>
                </label>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
