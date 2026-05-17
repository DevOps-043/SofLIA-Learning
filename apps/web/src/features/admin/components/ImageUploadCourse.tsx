'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PhotoIcon, XMarkIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline'
import { Image as ImageIcon, Upload, CheckCircle2 } from 'lucide-react'

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

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setError('Tipo de archivo no válido. Solo se permiten imágenes (PNG, JPEG, JPG, GIF)')
      return
    }

    const maxSize = 8 * 1024 * 1024 // 8MB
    if (file.size > maxSize) {
      setError('El archivo es demasiado grande. Máximo 8MB')
      return
    }

    setError(null)
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', 'courses')
      formData.append('folder', 'images')

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
      
      setTimeout(() => {
        setIsUploading(false)
        setUploadProgress(0)
      }, 1000)

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al subir la imagen')
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
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/gif"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      <AnimatePresence mode="wait">
        {!value ? (
          <motion.div
            key="upload-area"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
              ${disabled || isUploading 
                ? 'border-[#6C757D]/30 bg-[#E9ECEF]/30 dark:bg-[#0A0D12] cursor-not-allowed' 
                : dragActive
                ? 'border-[#00D4B3] bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 cursor-pointer scale-[1.02]'
                : 'border-[#E9ECEF] dark:border-[#6C757D]/30 bg-white dark:bg-[#0A0D12] hover:border-[#00D4B3]/50 hover:bg-[#00D4B3]/5 dark:hover:bg-[#00D4B3]/10 cursor-pointer'
              }
            `}
          >
            {isUploading ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <CloudArrowUpIcon className="mx-auto h-12 w-12 text-[#00D4B3]" />
                </motion.div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-[#0A2540] dark:text-white">
                    Subiendo imagen...
                  </p>
                  <div className="w-full bg-[#E9ECEF] dark:bg-[#1E2329] rounded-full h-2 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                      className="bg-gradient-to-r from-[#00D4B3] to-[#10B981] h-2 rounded-full"
                    />
                  </div>
                  <p className="text-xs text-[#6C757D] dark:text-white/60">{uploadProgress}%</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-xl bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-[#00D4B3]" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#0A2540] dark:text-white">
                    {dragActive ? 'Suelta la imagen aquí' : 'Hacer clic para subir imagen'}
                  </p>
                  <p className="text-xs text-[#6C757D] dark:text-white/60">
                    o arrastra y suelta
                  </p>
                  <p className="text-xs text-[#6C757D] dark:text-white/50 mt-2">
                    PNG, JPEG, JPG, GIF (máximo 8MB)
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative group"
          >
            <div className="relative overflow-hidden rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30">
              <img
                src={value}
                alt="Preview del curso"
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>
            
            <motion.button
              type="button"
              onClick={handleRemove}
              disabled={disabled || isUploading}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="absolute top-3 right-3 p-2 bg-red-500 hover:bg-red-600 disabled:bg-[#6C757D] text-white rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XMarkIcon className="h-4 w-4" />
            </motion.button>
            
            <motion.button
              type="button"
              onClick={handleClick}
              disabled={disabled || isUploading}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="absolute bottom-3 right-3 px-4 py-2 bg-gradient-to-r from-[#0A2540] to-[#0A2540]/90 hover:from-[#0d2f4d] hover:to-[#0A2540] disabled:from-[#6C757D] disabled:to-[#6C757D] text-white text-sm font-medium rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Cambiar imagen
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-lg"
        >
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </motion.div>
      )}
    </div>
  )
}
