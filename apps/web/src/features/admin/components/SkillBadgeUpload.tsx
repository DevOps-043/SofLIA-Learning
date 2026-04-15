'use client'

import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Upload, X, Check, Loader2, Image as ImageIcon } from 'lucide-react'
import { SkillLevel, SKILL_LEVELS, getLevelInfo } from '@/features/skills/constants/skillLevels'

interface SkillBadgeUploadProps {
  skillId: string | null
  skillSlug: string
  badges: Record<SkillLevel, string | null>
  onBadgeChange: (level: SkillLevel, url: string | null) => void
  disabled?: boolean
}

const LEVELS: SkillLevel[] = ['green', 'bronze', 'silver', 'gold', 'diamond']

export function SkillBadgeUpload({
  skillId,
  skillSlug,
  badges,
  onBadgeChange,
  disabled = false
}: SkillBadgeUploadProps) {
  const { t } = useTranslation('common')
  const [uploading, setUploading] = useState<Record<SkillLevel, boolean>>({
    green: false,
    bronze: false,
    silver: false,
    gold: false,
    diamond: false
  })
  const [errors, setErrors] = useState<Record<SkillLevel, string | null>>({
    green: null,
    bronze: null,
    silver: null,
    gold: null,
    diamond: null
  })
  const fileInputRefs = useRef<Record<SkillLevel, HTMLInputElement | null>>({
    green: null,
    bronze: null,
    silver: null,
    gold: null,
    diamond: null
  })

  const handleFileSelect = async (level: SkillLevel, file: File | null) => {
    // Limpiar errores previos
    setErrors(prev => ({ ...prev, [level]: null }))
    
    if (!file) {
      return
    }

    if (!skillSlug || skillSlug.trim() === '') {
      setErrors(prev => ({ ...prev, [level]: 'Primero debes crear un slug para la skill' }))
      return
    }

    // Validar tipo
    if (file.type !== 'image/png') {
      setErrors(prev => ({ ...prev, [level]: 'Solo se permiten archivos PNG' }))
      return
    }

    // Validar tamaño (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, [level]: 'El archivo no puede ser mayor a 2MB' }))
      return
    }

    setUploading(prev => ({ ...prev, [level]: true }))

    try {
      const formData = new FormData()
      formData.append('file', file)
      if (skillId) {
        formData.append('skillId', skillId)
      }
      formData.append('level', level)
      formData.append('skillSlug', skillSlug.trim())

      const response = await fetch('/api/admin/upload/skill-badge', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al subir el badge')
      }

      // Actualizar el badge con la URL recibida
      if (data.badge?.badge_url) {
        onBadgeChange(level, data.badge.badge_url)
      } else {
        throw new Error('No se recibió la URL del badge')
      }
    } catch (error) {
      console.error(`Error uploading badge for level ${level}:`, error)
      setErrors(prev => ({
        ...prev,
        [level]: error instanceof Error ? error.message : 'Error al subir el badge'
      }))
    } finally {
      setUploading(prev => ({ ...prev, [level]: false }))
    }
  }

  const handleDelete = async (level: SkillLevel) => {
    if (!skillId) return

    try {
      const response = await fetch(`/api/admin/skills/${skillId}/badges/${level}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al eliminar el badge')
      }

      onBadgeChange(level, null)
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        [level]: error instanceof Error ? error.message : 'Error al eliminar el badge'
      }))
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Badges por Nivel
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Sube imágenes PNG (máx. 2MB) para cada nivel de la skill. Los badges aparecerán en el perfil de los usuarios según su progreso.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {LEVELS.map((level) => {
          const levelInfo = getLevelInfo(level)
          const badgeUrl = badges[level]
          const isUploading = uploading[level]
          const error = errors[level]

          return (
            <div
              key={level}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: levelInfo.color }}
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {levelInfo.displayName}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {levelInfo.description}
                  </p>
                </div>
              </div>

              {/* Preview o Upload */}
              {badgeUrl ? (
                <div className="relative">
                  <img
                    src={badgeUrl}
                    alt={`${levelInfo.displayName} badge`}
                    className="w-full h-32 object-contain rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                  {!disabled && (
                    <button
                      onClick={() => handleDelete(level)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      title={t('actions.delete')}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    No hay badge subido
                  </p>
                  {!disabled && !isUploading && (
                    <label 
                      htmlFor={`badge-upload-${level}`}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      Subir PNG
                      <input
                        id={`badge-upload-${level}`}
                        ref={(el) => {
                          fileInputRefs.current[level] = el
                        }}
                        type="file"
                        accept="image/png"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleFileSelect(level, file)
                            // Resetear el input para permitir subir el mismo archivo de nuevo si es necesario
                            e.target.value = ''
                          }
                        }}
                        onClick={(e) => {
                          // Asegurar que el click se propaga correctamente
                          e.stopPropagation()
                        }}
                        disabled={disabled || isUploading}
                      />
                    </label>
                  )}
                </div>
              )}

              {/* Estado de carga */}
              {isUploading && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Subiendo...</span>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                  {error}
                </div>
              )}

              {/* Botón para cambiar badge */}
              {badgeUrl && !disabled && !isUploading && (
                <label 
                  htmlFor={`badge-change-${level}`}
                  className="block w-full text-center px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                >
                  Cambiar
                  <input
                    id={`badge-change-${level}`}
                    type="file"
                    accept="image/png"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleFileSelect(level, file)
                        // Resetear el input para permitir subir el mismo archivo de nuevo si es necesario
                        e.target.value = ''
                      }
                    }}
                    onClick={(e) => {
                      // Asegurar que el click se propaga correctamente
                      e.stopPropagation()
                    }}
                    disabled={disabled || isUploading}
                  />
                </label>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

