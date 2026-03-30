'use client'

import { useState, useRef } from 'react'
import { PhotoIcon, XMarkIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline'
import { createClient } from '../../../lib/supabase/client'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  bucket?: string
  folder?: string
  className?: string
  disabled?: boolean
}

export function ImageUpload({ 
  value, 
  onChange, 
  bucket = 'news', 
  folder = 'hero-images',
  className = '',
  disabled = false 
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten archivos de imagen')
      return
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen debe ser menor a 5MB')
      return
    }

    setError(null)
    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Usar API route que tiene service role key para bypass RLS
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', bucket)
      formData.append('folder', folder)

      // Simular progreso
      setUploadProgress(30)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      setUploadProgress(70)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al subir la imagen')
      }

      const result = await response.json()

      if (!result.success || !result.url) {
        throw new Error('Error al obtener la URL de la imagen')
      }

      setUploadProgress(100)
      onChange(result.url)
      
    } catch (err: any) {
      setError(err.message || 'Error al subir la imagen')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleRemoveImage = () => {
    onChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Área de carga */}
      {!value ? (
      <div
        onClick={handleClick}
        className={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${disabled || isUploading 
              ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 cursor-not-allowed' 
              : 'border-gray-300 dark:border-gray-500 bg-gray-50 dark:bg-gray-800 hover:border-blue-500 dark:hover:border-primary hover:bg-gray-100 dark:hover:bg-gray-700'
            }
          `}
        style={!(disabled || isUploading) ? {
          borderColor: 'var(--org-primary-button-color, #3b82f6)'
        } : {}}
        >
          {isUploading ? (
            <div className="space-y-3">
              <CloudArrowUpIcon
                className="mx-auto h-12 w-12 animate-pulse"
                style={{ color: 'var(--org-primary-button-color, #3b82f6)' }}
              />
              <div className="text-sm text-carbon-300">
                <div className="mb-2">Subiendo imagen...</div>
                <div className="w-full bg-carbon-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${uploadProgress}%`,
                      backgroundColor: 'var(--org-primary-button-color, #3b82f6)'
                    }}
                  />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{uploadProgress}%</div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <PhotoIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-400" />
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <div className="font-medium">Hacer clic para subir imagen</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  PNG, JPG, GIF hasta 5MB
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Preview de imagen */
          <div className="relative">
            <img
            src={value}
              alt="Preview"
            className="w-full h-48 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
            />
              <button
                type="button"
            onClick={handleRemoveImage}
            disabled={disabled || isUploading}
            className="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white rounded-full transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
          
          {/* Botón para cambiar imagen */}
          <button
            type="button"
            onClick={handleClick}
            disabled={disabled || isUploading}
            className="absolute bottom-2 right-2 px-3 py-1 disabled:bg-carbon-600 text-white text-sm rounded transition-colors"
            style={!(disabled || isUploading) ? {
              backgroundColor: 'var(--org-primary-button-color, #3b82f6)'
            } : {}}
            onMouseEnter={(e) => {
              if (!(disabled || isUploading)) {
                e.currentTarget.style.backgroundColor = 'rgba(var(--org-primary-button-color-rgb, 59, 130, 246), 0.9)'
              }
            }}
            onMouseLeave={(e) => {
              if (!(disabled || isUploading)) {
                e.currentTarget.style.backgroundColor = 'var(--org-primary-button-color, #3b82f6)'
              }
            }}
          >
            Cambiar
          </button>
          </div>
        )}

      {/* Mostrar error */}
      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/50 rounded-lg p-3">
          {error}
        </div>
      )}
    </div>
  )
}
