'use client'

import { useState, useRef, useEffect } from 'react'
import { Youtube, Video, Link as LinkIcon, Upload, X, Play, FileVideo } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface VideoProviderSelectorProps {
  provider: 'youtube' | 'vimeo' | 'direct' | 'custom'
  videoProviderId: string
  onProviderChange: (provider: 'youtube' | 'vimeo' | 'direct' | 'custom') => void
  onVideoIdChange: (id: string) => void
  onDurationChange?: (durationSeconds: number) => void
  onUploadComplete?: (url: string) => void
  disabled?: boolean
}

export function VideoProviderSelector({
  provider,
  videoProviderId,
  onProviderChange,
  onVideoIdChange,
  onDurationChange,
  onUploadComplete,
  disabled = false
}: VideoProviderSelectorProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [videoDuration, setVideoDuration] = useState<string>('')
  const [detectingDuration, setDetectingDuration] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [dragActive, setDragActive] = useState(false)

  // Función para convertir duración en formato mm:ss a segundos
  const parseDurationToSeconds = (durationString: string): number => {
    const [minutes, seconds] = durationString.split(':').map(Number)
    return (minutes * 60) + (seconds || 0)
  }

  // Función para detectar duración de YouTube usando API route
  const detectYouTubeDuration = async (videoIdOrUrl: string): Promise<number | null> => {
    try {
      const response = await fetch('/api/admin/video-duration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'youtube', videoIdOrUrl })
      })

      if (!response.ok) {
        return null
      }

      const data = await response.json()
      return data.duration || null
    } catch (error) {
      return null
    }
  }

  // Función para detectar duración de Vimeo usando API route
  const detectVimeoDuration = async (videoIdOrUrl: string): Promise<number | null> => {
    try {
      const response = await fetch('/api/admin/video-duration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'vimeo', videoIdOrUrl })
      })

      if (!response.ok) {
        return null
      }

      const data = await response.json()
      return data.duration || null
    } catch (error) {
      return null
    }
  }

  // Función para detectar duración de URL personalizada
  const detectCustomUrlDuration = async (url: string): Promise<number | null> => {
    try {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.crossOrigin = 'anonymous'
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve(null)
        }, 10000) // 10 segundos timeout

        video.onloadedmetadata = () => {
          clearTimeout(timeout)
          const duration = video.duration
          if (!isNaN(duration) && isFinite(duration)) {
            resolve(Math.floor(duration))
          } else {
            resolve(null)
          }
        }

        video.onerror = () => {
          clearTimeout(timeout)
          resolve(null)
        }

        video.src = url
      })
    } catch (error) {
      return null
    }
  }

  // Generar preview del video cuando se selecciona un archivo
  useEffect(() => {
    if (provider !== 'direct') {
      // Si no es el proveedor directo, limpiar el preview
      setVideoPreview(null)
      setSelectedFile(null)
      setVideoDuration('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    if (selectedFile) {
      try {
        const url = URL.createObjectURL(selectedFile)
        setVideoPreview(url)
        
        // Obtener duración del video con mejor manejo de errores
        const video = document.createElement('video')
        video.preload = 'metadata'
        video.muted = true // Muted para evitar problemas de autoplay
        
        let timeoutId: NodeJS.Timeout | null = null
        
        const handleLoadedMetadata = () => {
          try {
            if (timeoutId) clearTimeout(timeoutId)
            const duration = video.duration
            if (!isNaN(duration) && isFinite(duration) && duration > 0) {
              const minutes = Math.floor(duration / 60)
              const seconds = Math.floor(duration % 60)
              const durationString = `${minutes}:${seconds.toString().padStart(2, '0')}`
              setVideoDuration(durationString)
              // Notificar duración al componente padre
              if (onDurationChange) {
                onDurationChange(Math.floor(duration))
              }
            }
          } catch (error) {
            // No hacer nada si falla, el usuario puede ingresar la duración manualmente
          }
        }
        
        const handleError = (error: Event | Error) => {
          try {
            if (timeoutId) clearTimeout(timeoutId)
            // No mostrar duración si hay error
            setVideoDuration('')
          } catch (e) {
            // Ignorar errores en el manejo de errores
          }
        }
        
        video.addEventListener('loadedmetadata', handleLoadedMetadata)
        video.addEventListener('error', handleError)
        
        // Timeout de seguridad (10 segundos)
        timeoutId = setTimeout(() => {
          video.removeEventListener('loadedmetadata', handleLoadedMetadata)
          video.removeEventListener('error', handleError)
          video.src = ''
          if (timeoutId) clearTimeout(timeoutId)
        }, 10000)
        
        video.src = url
        
        return () => {
          try {
            if (timeoutId) clearTimeout(timeoutId)
            video.removeEventListener('loadedmetadata', handleLoadedMetadata)
            video.removeEventListener('error', handleError)
            video.src = ''
            URL.revokeObjectURL(url)
          } catch (error) {
            // Ignorar errores en cleanup
          }
        }
      } catch (error) {
        setVideoPreview(null)
        setVideoDuration('')
      }
    } else if (videoProviderId && provider === 'direct') {
      // Si ya hay un videoProviderId, usarlo como preview
      setVideoPreview(videoProviderId)
      
      // Intentar obtener duración del video guardado con mejor manejo de errores
      try {
        const video = document.createElement('video')
        video.preload = 'metadata'
        video.muted = true
        video.crossOrigin = 'anonymous'
        
        let timeoutId: NodeJS.Timeout | null = null
        
        const handleLoadedMetadata = () => {
          try {
            if (timeoutId) clearTimeout(timeoutId)
            const duration = video.duration
            if (!isNaN(duration) && isFinite(duration) && duration > 0) {
              const minutes = Math.floor(duration / 60)
              const seconds = Math.floor(duration % 60)
              const durationString = `${minutes}:${seconds.toString().padStart(2, '0')}`
              setVideoDuration(durationString)
              // Notificar duración al componente padre
              if (onDurationChange) {
                onDurationChange(Math.floor(duration))
              }
            }
          } catch (error) {
          }
        }
        
        const handleError = (error: Event | Error) => {
          try {
            if (timeoutId) clearTimeout(timeoutId)
            setVideoDuration('')
          } catch (e) {
            // Ignorar errores
          }
        }
        
        video.addEventListener('loadedmetadata', handleLoadedMetadata)
        video.addEventListener('error', handleError)
        
        // Timeout de seguridad (10 segundos)
        timeoutId = setTimeout(() => {
          video.removeEventListener('loadedmetadata', handleLoadedMetadata)
          video.removeEventListener('error', handleError)
          video.src = ''
          if (timeoutId) clearTimeout(timeoutId)
        }, 10000)
        
        video.src = videoProviderId
        
        return () => {
          try {
            if (timeoutId) clearTimeout(timeoutId)
            video.removeEventListener('loadedmetadata', handleLoadedMetadata)
            video.removeEventListener('error', handleError)
            video.src = ''
          } catch (error) {
            // Ignorar errores en cleanup
          }
        }
      } catch (error) {
        setVideoDuration('')
      }
    } else {
      setVideoPreview(null)
      setVideoDuration('')
    }
  }, [selectedFile, videoProviderId, provider, onDurationChange])

  const handleFileSelect = (file: File) => {
    if (!file) return

    // Validar tipo de video
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo', 'video/avi']
    if (!allowedTypes.includes(file.type)) {
      alert('Tipo de video no válido. Solo se permiten MP4, WebM y OGG')
      return
    }

    // Validar tamaño (máximo 1GB)
    const maxSize = 1024 * 1024 * 1024 // 1GB
    if (file.size > maxSize) {
      alert('El video excede el tamaño máximo de 1GB')
      return
    }

    setSelectedFile(file)
    // Subir automáticamente
    handleFileUpload(file)
  }

  const handleFileUpload = async (file: File) => {
    if (!file) return

    setUploading(true)
    setUploadProgress(0)

    try {
      // Subir directamente a Supabase Storage desde el cliente
      // Esto evita los límites de tamaño de body en Next.js/Netlify
      const supabase = createClient()
      
      // Generar nombre único para el archivo
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'mp4'
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `videos/${fileName}`


      // Simular progreso (Supabase no tiene callback de progreso nativo)
      setUploadProgress(30)

      // Intentar subir directamente al bucket course-videos
      // Si falla por permisos, intentar obtener signed URL primero
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('course-videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        })

      setUploadProgress(70)

      if (uploadError) {
        
        // Si el error es de permisos, intentar usar API route como fallback
        if (uploadError.message?.includes('new row violates row-level security') || 
            uploadError.message?.includes('permission denied') ||
            uploadError.statusCode === '403') {
          
          // Fallback: usar API route (puede fallar para archivos muy grandes, pero intentamos)
          const formData = new FormData()
          formData.append('file', file)

          const response = await fetch('/api/admin/upload/course-videos', {
            method: 'POST',
            body: formData
          })

          const contentType = response.headers.get('content-type')
          const isJson = contentType && contentType.includes('application/json')

          if (!isJson) {
            const textResponse = await response.text().catch(() => '')
            //   status: response.status,
            //   contentType,
            //   preview: textResponse.substring(0, 200)
            // })
            throw new Error(`El servidor devolvió una respuesta inválida (${response.status}). El archivo puede ser demasiado grande para la API route.`)
          }

          const result = await response.json()

          if (!response.ok) {
            const errorMessage = result.details || result.error || result.message || 'Error al subir el video'
            throw new Error(errorMessage)
          }

          if (!result.success || !result.url) {
            throw new Error('No se recibió la URL del video subido')
          }

          setUploadProgress(100)
          onVideoIdChange(result.url)
          if (onUploadComplete) onUploadComplete(result.url)
          return
        }

        throw new Error(`Error al subir el video: ${uploadError.message}`)
      }

      if (!uploadData) {
        throw new Error('No se recibió confirmación de la subida')
      }

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('course-videos')
        .getPublicUrl(filePath)

      if (!urlData?.publicUrl) {
        throw new Error('Error al obtener la URL pública del video')
      }


      setUploadProgress(100)
      onVideoIdChange(urlData.publicUrl)
      if (onUploadComplete) onUploadComplete(urlData.publicUrl)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al subir el video'
      alert(`Error al subir el video: ${errorMessage}`)
    } finally {
      setUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }


  return (
    <div className="space-y-4">
      {/* Selector de Proveedor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Proveedor de Video
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onProviderChange('youtube')}
            disabled={disabled}
            className={`
              flex items-center space-x-2 p-3 rounded-lg border-2 transition-colors
              ${provider === 'youtube'
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <Youtube className="h-5 w-5 text-red-600 dark:text-red-400" />
            <span className="text-sm font-medium">YouTube</span>
          </button>

          <button
            type="button"
            onClick={() => onProviderChange('vimeo')}
            disabled={disabled}
            className={`
              flex items-center space-x-2 p-3 rounded-lg border-2 transition-colors
              ${provider === 'vimeo'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <Video className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium">Vimeo</span>
          </button>

          <button
            type="button"
            onClick={() => onProviderChange('direct')}
            disabled={disabled}
            className={`
              flex items-center space-x-2 p-3 rounded-lg border-2 transition-colors
              ${provider === 'direct'
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <Video className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium">Subir Video</span>
          </button>

          <button
            type="button"
            onClick={() => onProviderChange('custom')}
            disabled={disabled}
            className={`
              flex items-center space-x-2 p-3 rounded-lg border-2 transition-colors
              ${provider === 'custom'
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <LinkIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium">URL Personalizada</span>
          </button>
        </div>
      </div>

      {/* Input según el proveedor */}
      <div>
        {provider === 'youtube' && (
          <>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ID o URL de YouTube
            </label>
            <input
              type="text"
              value={videoProviderId}
              onChange={async (e) => {
                const value = e.target.value
                onVideoIdChange(value)
                

                // Detectar duración automáticamente
                if (value && value.trim()) {
                  setDetectingDuration(true)
                  try {
                    const duration = await detectYouTubeDuration(value)
                    if (duration && onDurationChange) {
                      onDurationChange(duration)
                    }
                  } catch (error) {
                  } finally {
                    setDetectingDuration(false)
                  }
                }
              }}
              placeholder="Ej: dQw4w9WgXcQ o https://www.youtube.com/watch?v=dQw4w9WgXcQ"
              disabled={disabled}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            {detectingDuration && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Detectando duración del video...
              </p>
            )}
          </>
        )}

        {provider === 'vimeo' && (
          <>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ID o URL de Vimeo
            </label>
            <input
              type="text"
              value={videoProviderId}
              onChange={async (e) => {
                const value = e.target.value
                onVideoIdChange(value)
                

                // Detectar duración automáticamente
                if (value && value.trim()) {
                  setDetectingDuration(true)
                  try {
                    const duration = await detectVimeoDuration(value)
                    if (duration && onDurationChange) {
                      onDurationChange(duration)
                    }
                  } catch (error) {
                  } finally {
                    setDetectingDuration(false)
                  }
                }
              }}
              placeholder="Ej: 123456789 o https://vimeo.com/123456789"
              disabled={disabled}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            {detectingDuration && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Detectando duración del video...
              </p>
            )}
          </>
        )}

        {provider === 'direct' && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subir Video
            </label>

            {videoPreview ? (
              <div className="relative group">
                <div className="relative bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                  {/* Video Preview */}
                  <video
                    ref={videoRef}
                    src={videoPreview}
                    className="w-full h-64 object-contain bg-black"
                    controls
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onLoadedMetadata={(e) => {
                      try {
                        const video = e.currentTarget
                        const duration = video.duration
                        if (!isNaN(duration) && isFinite(duration) && duration > 0) {
                          const minutes = Math.floor(duration / 60)
                          const seconds = Math.floor(duration % 60)
                          const durationString = `${minutes}:${seconds.toString().padStart(2, '0')}`
                          setVideoDuration(durationString)
                          // Notificar duración al componente padre
                          if (onDurationChange) {
                            onDurationChange(Math.floor(duration))
                          }
                        }
                      } catch (error) {
                        // No hacer nada si falla
                      }
                    }}
                    onError={(e) => {
                      // No romper la aplicación si el video no se puede cargar
                    }}
                    onClick={(e) => {
                      const video = e.currentTarget
                      if (video.paused) {
                        video.play()
                        setIsPlaying(true)
                      } else {
                        video.pause()
                        setIsPlaying(false)
                      }
                    }}
                  />
                  

                  {/* Botón para eliminar video */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedFile(null)
                      setVideoPreview(null)
                      onVideoIdChange('')
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                      }
                      if (videoRef.current) {
                        videoRef.current.pause()
                        setIsPlaying(false)
                      }
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors z-10"
                    title="Eliminar video"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Información del video */}
                  {(selectedFile || (videoProviderId && !selectedFile)) && (
                    <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-sm rounded-lg p-2 text-white text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate mr-2">
                          {selectedFile ? selectedFile.name : 'Video guardado'}
                        </span>
                        {videoDuration && <span className="flex-shrink-0">{videoDuration}</span>}
                      </div>
                      {selectedFile && (
                        <div className="mt-1 text-gray-300">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {uploading && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Subiendo video... {uploadProgress}%
                      </p>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo,video/avi"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileSelect(file)
                  }}
                  disabled={disabled || uploading}
                  className="hidden"
                />

                {!uploading && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
                    className="mt-2 w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm font-medium"
                  >
                    Cambiar Video
                  </button>
                )}
              </div>
            ) : (
              <div
                className={`
                  relative border-2 border-dashed rounded-xl p-8 transition-colors
                  ${dragActive
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }
                  ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                onDragEnter={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (!disabled && !uploading) setDragActive(true)
                }}
                onDragLeave={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setDragActive(false)
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setDragActive(false)
                  if (disabled || uploading) return
                  const file = e.dataTransfer.files?.[0]
                  if (file && file.type.startsWith('video/')) {
                    handleFileSelect(file)
                  }
                }}
                onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo,video/avi"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileSelect(file)
                  }}
                  disabled={disabled || uploading}
                  className="hidden"
                />
                

                <div className="text-center">
                  <Upload className={`w-12 h-12 mx-auto mb-3 ${
                    dragActive 
                      ? 'text-blue-500' 
                      : 'text-gray-400 dark:text-gray-500'
                  }`} />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {dragActive ? 'Suelta el video aquí' : 'Arrastra un video aquí o haz clic para seleccionar'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    MP4, WebM, OGG, MOV, AVI (máximo 1GB)
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {provider === 'custom' && (
          <>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              URL del Video
            </label>
            <input
              type="url"
              value={videoProviderId}
              onChange={async (e) => {
                const value = e.target.value
                onVideoIdChange(value)

                // Detectar duración automáticamente
                if (value && value.trim() && (value.startsWith('http://') || value.startsWith('https://'))) {
                  setDetectingDuration(true)
                  try {
                    const duration = await detectCustomUrlDuration(value)
                    if (duration && onDurationChange) {
                      onDurationChange(duration)
                    }
                  } catch (error) {
                  } finally {
                    setDetectingDuration(false)
                  }
                }
              }}
              placeholder="https://ejemplo.com/video.mp4"
              disabled={disabled}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            {detectingDuration && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Detectando duración del video...
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

