'use client'

import { useState, useRef } from 'react'
import { PenTool, Image as ImageIcon, X, Upload, CheckCircle } from 'lucide-react'

interface InstructorSignatureUploadProps {
  onUpload?: (url: string | null, signatureName: string | null) => void
  currentSignatureUrl?: string | null
  currentSignatureName?: string | null
}

export function InstructorSignatureUpload({
  onUpload,
  currentSignatureUrl,
  currentSignatureName
}: InstructorSignatureUploadProps) {
  const [uploadMode, setUploadMode] = useState<'image' | 'text'>('image')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [signatureName, setSignatureName] = useState(currentSignatureName || '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    if (!file) return

    // Validar tipo de archivo
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      setError('Tipo de archivo no permitido. Solo se permiten imágenes (PNG, JPEG, JPG, GIF, WebP, SVG)')
      return
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      setError('El archivo excede el tamaño máximo de 5MB')
      return
    }

    setError(null)
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)

      // Simular progreso
      const interval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      const response = await fetch('/api/instructor/upload-signature', {
        method: 'POST',
        body: formData
      })

      clearInterval(interval)
      setUploadProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al subir la firma')
      }

      const result = await response.json()

      if (!result.success || !result.url) {
        throw new Error('Error al obtener la URL de la firma')
      }

      setSuccess('Firma subida exitosamente')
      onUpload?.(result.url, null)

      setTimeout(() => {
        setIsUploading(false)
        setUploadProgress(0)
        setSuccess(null)
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir la firma')
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleSaveName = async () => {
    if (!signatureName.trim()) {
      setError('Por favor ingresa un nombre de firma')
      return
    }

    setError(null)
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('signatureName', signatureName.trim())

      const response = await fetch('/api/instructor/upload-signature', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al guardar el nombre de firma')
      }

      const result = await response.json()

      setSuccess('Nombre de firma guardado exitosamente')
      onUpload?.(null, signatureName.trim())

      setTimeout(() => {
        setIsUploading(false)
        setSuccess(null)
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el nombre de firma')
      setIsUploading(false)
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
    onUpload?.(null, null)
    setError(null)
    setSuccess(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      {/* Selector de modo */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setUploadMode('image')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            uploadMode === 'image'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <ImageIcon className="w-4 h-4" />
            <span>Subir Imagen</span>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setUploadMode('text')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            uploadMode === 'text'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <PenTool className="w-4 h-4" />
            <span>Escribir Nombre</span>
          </div>
        </button>
      </div>

      {/* Modo: Subir imagen */}
      {uploadMode === 'image' && (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={isUploading}
          />

          {currentSignatureUrl ? (
            <div className="relative">
              <img
                src={currentSignatureUrl}
                alt="Firma actual"
                className="w-full h-48 object-contain bg-gray-800 rounded-lg border border-gray-700"
              />
              <button
                type="button"
                onClick={handleRemove}
                disabled={isUploading}
                className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => !isUploading && fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`
                relative border-2 border-dashed rounded-xl p-8 text-center transition-colors
                ${isUploading 
                  ? 'border-gray-600 bg-gray-800 cursor-not-allowed' 
                  : dragActive
                  ? 'border-blue-500 bg-blue-500/10 cursor-pointer'
                  : 'border-gray-700 bg-gray-800/50 hover:border-blue-500 hover:bg-gray-800 cursor-pointer'
                }
              `}
            >
              {isUploading ? (
                <div className="space-y-3">
                  <Upload className="mx-auto h-12 w-12 text-blue-400 animate-pulse" />
                  <div className="text-sm text-gray-300">
                    <div className="mb-2">Subiendo firma...</div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{uploadProgress}%</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="text-sm text-gray-300">
                    <div className="font-medium">
                      {dragActive ? 'Suelta la imagen aquí' : 'Hacer clic para subir imagen de firma o arrastrar y soltar'}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      PNG, JPEG, JPG, GIF, WebP, SVG (máximo 5MB)
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modo: Escribir nombre */}
      {uploadMode === 'text' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nombre de Firma
            </label>
            <input
              type="text"
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
              placeholder="Ej: Dr. Juan Pérez"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isUploading}
            />
            <p className="text-xs text-gray-400 mt-1">
              Este nombre aparecerá en los certificados que generes
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveName}
            disabled={isUploading || !signatureName.trim()}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Guardando...' : 'Guardar Nombre de Firma'}
          </button>
        </div>
      )}

      {/* Mostrar firma actual (nombre) */}
      {currentSignatureName && !currentSignatureUrl && (
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Firma actual:</p>
              <p className="text-lg font-semibold text-gray-200">{currentSignatureName}</p>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="p-2 text-red-400 hover:text-red-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Mensajes de error y éxito */}
      {error && (
        <div className="text-sm text-red-400 bg-red-500/20 border border-red-500/50 rounded-lg p-3">
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/20 border border-green-500/50 rounded-lg p-3">
          <CheckCircle className="w-5 h-5" />
          <span>{success}</span>
        </div>
      )}
    </div>
  )
}

