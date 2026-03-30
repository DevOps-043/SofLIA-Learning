'use client'

import { useState, useRef } from 'react'
import { PhotoIcon, XMarkIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline'

interface ImageUploadCourseProps {
  value?: string
  onChange: (url: string) => void
  disabled?: boolean
  className?: string
}

export function ImageUploadCourse({ 
  value, 
  onChange, 
  disabled = false,
  className = '' 
}: ImageUploadCourseProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    if (!file) return

    // Validar tipo de archivo - Solo imágenes permitidas por el bucket
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setError('Tipo de archivo no válido. Solo se permiten imágenes (PNG, JPEG, JPG, GIF)')
      return
    }

    // Validar tamaño (máximo 8MB según configuración del bucket)
    const maxSize = 8 * 1024 * 1024 // 8MB
    if (file.size > maxSize) {
      setError('El archivo es demasiado grande. Máximo 8MB')
      return
    }

    setError(null)
    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Usar API route que tiene service role key para bypass RLS
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', 'courses')
      formData.append('folder', 'images')

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
      
      // Resetear después de un momento
      setTimeout(() => {
        setIsUploading(false)
        setUploadProgress(0)
      }, 1000)

    } catch (err: any) {
      setError(err.message || 'Error al subir la imagen')
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleRemove = () => {
    onChange('')
    setError(null)
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
        accept="image/png,image/jpeg,image/jpg,image/gif"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Área de carga o preview */}
      {!value ? (
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative border-2 border-dashed rounded-xl p-6 text-center transition-colors
            ${disabled || isUploading 
              ? 'border-gray-600 bg-gray-800 cursor-not-allowed' 
              : dragActive
              ? 'border-purple-500 bg-purple-500/10 cursor-pointer'
              : 'border-gray-700 bg-gray-800/50 hover:border-purple-500 hover:bg-gray-800 cursor-pointer'
            }
          `}
        >
          {isUploading ? (
            <div className="space-y-3">
              <CloudArrowUpIcon className="mx-auto h-12 w-12 text-purple-400 animate-pulse" />
              <div className="text-sm text-gray-300">
                <div className="mb-2">Subiendo imagen...</div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1">{uploadProgress}%</div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <PhotoIcon className="mx-auto h-12 w-12 text-gray-400 group-hover:text-purple-400 transition-colors" />
              <div className="text-sm text-gray-300">
                <div className="font-medium">
                  {dragActive ? 'Suelta la imagen aquí' : 'Hacer clic para subir imagen o arrastrar y soltar'}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  PNG, JPEG, JPG, GIF (máximo 8MB)
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Preview de imagen subida */
        <div className="relative">
          <img
            src={value}
            alt="Preview"
            className="w-full h-48 object-cover rounded-xl border border-gray-700"
          />
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled || isUploading}
            className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
          
          {/* Botón para cambiar imagen */}
          <button
            type="button"
            onClick={handleClick}
            disabled={disabled || isUploading}
            className="absolute bottom-2 right-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cambiar imagen
          </button>
        </div>
      )}

      {/* Mostrar error */}
      {error && (
        <div className="text-sm text-red-400 bg-red-500/20 border border-red-500/50 rounded-lg p-3">
          {error}
        </div>
      )}
    </div>
  )
}

