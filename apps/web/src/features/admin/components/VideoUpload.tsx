'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, Play, X, CheckCircle, AlertCircle } from 'lucide-react'

interface VideoUploadProps {
  value?: string
  onChange: (url: string) => void
  disabled?: boolean
}

export function VideoUpload({ value, onChange, disabled = false }: VideoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  const handleFileSelect = async (file: File) => {
    if (!file) return

    // Validar tipo de archivo
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov']
    if (!allowedTypes.includes(file.type)) {
      setError('Tipo de archivo no válido. Solo se permiten videos (MP4, WebM, OGG, AVI, MOV)')
      return
    }

    // Validar tamaño (máximo 100MB)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      setError('El archivo es demasiado grande. Máximo 100MB')
      return
    }

    setUploading(true)
    setError(null)
    setProgress(0)

    try {
      // Generar nombre único para el archivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `Videos/${fileName}`

      // Subir archivo a Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('Reels')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw uploadError
      }

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('Reels')
        .getPublicUrl(filePath)

      setProgress(100)
      onChange(publicUrl)
      
      // Resetear después de un momento
      setTimeout(() => {
        setUploading(false)
        setProgress(0)
      }, 1000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir el video')
      setUploading(false)
      setProgress(0)
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

  const removeFile = () => {
    onChange('')
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Video *
      </label>
      
      {value ? (
        <div className="relative">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600">
            <Play className="w-5 h-5 text-blue-600 dark:text-blue-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 dark:text-white truncate">
                Video subido exitosamente
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {value.split('/').pop()}
              </p>
            </div>
            <button
              onClick={removeFile}
              disabled={disabled}
              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-gray-50 dark:bg-gray-800'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/ogg,video/avi,video/mov"
            onChange={handleFileInputChange}
            disabled={disabled}
            className="hidden"
          />
          
          <div className="text-center">
            <Upload className={`w-8 h-8 mx-auto mb-2 ${
              dragActive ? 'text-blue-600 dark:text-blue-500' : 'text-gray-500 dark:text-gray-400'
            }`} />
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
              {dragActive ? 'Suelta el video aquí' : 'Arrastra un video aquí o haz clic para seleccionar'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              MP4, WebM, OGG, AVI, MOV (máximo 100MB)
            </p>
          </div>
        </div>
      )}

      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-500"></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Subiendo video...</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
