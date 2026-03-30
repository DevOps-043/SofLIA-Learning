'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Loader2 } from 'lucide-react'
import { InlineAttachmentButtons } from '../InlineAttachmentButtons'
import { AttachmentPreview } from '../AttachmentPreview'
import { YouTubeLinkModal } from '../AttachmentModals'
import { PollModal } from '../AttachmentModals'
import { useAttachments } from '../../hooks/useAttachments'

interface EditPostModalProps {
  isOpen: boolean
  onClose: () => void
  post: {
    id: string
    content: string
    attachment_url?: string | null
    attachment_type?: string | null
    attachment_data?: any
  }
  communitySlug: string
  onSave: (updatedPost?: any) => void
}

export function EditPostModal({
  isOpen,
  onClose,
  post,
  communitySlug,
  onSave
}: EditPostModalProps) {
  // Guardar el post inicial para evitar que cambios externos afecten el modal
  const [initialPost, setInitialPost] = useState(post)
  const [internalIsOpen, setInternalIsOpen] = useState(isOpen)
  const [content, setContent] = useState(post.content || '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [postAttachments, setPostAttachments] = useState<Array<{ type: string; data: any; id: string }>>([])
  const [showYouTubeModal, setShowYouTubeModal] = useState(false)
  const [showPollModal, setShowPollModal] = useState(false)
  const [pendingAttachmentType, setPendingAttachmentType] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isProcessingAttachment, setIsProcessingAttachment] = useState(false)

  const { processAttachment } = useAttachments()

  // Sincronizar estado interno con prop isOpen, pero mantener abierto si se está procesando
  useEffect(() => {
    if (isOpen && post?.id) {
      setInternalIsOpen(true)
      setInitialPost(post)
    } else if (!isOpen && !isSaving && !isProcessingAttachment) {
      // Solo cerrar si no se está procesando nada y el prop dice que debe cerrarse
      setInternalIsOpen(false)
    }
  }, [isOpen, post?.id, isSaving, isProcessingAttachment])

  // Asegurar que el componente esté montado antes de usar portal
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Inicializar attachments existentes solo cuando se abre el modal por primera vez
  useEffect(() => {
    if (isOpen && initialPost?.id) {
      setContent(initialPost.content || '')
      setError(null)
      setIsProcessingAttachment(false)
      
      // Si el post tiene attachments, convertirlos al formato esperado
      if (initialPost.attachment_type && initialPost.attachment_url) {
        const existingAttachment = {
          type: initialPost.attachment_type,
          data: initialPost.attachment_data || { url: initialPost.attachment_url },
          id: `existing-${initialPost.attachment_type}-${Date.now()}`
        }
        setPostAttachments([existingAttachment])
      } else {
        setPostAttachments([])
      }
    }
  }, [isOpen, initialPost?.id]) // Solo inicializar cuando se abre el modal

  const handleAttachmentSelect = (type: string, data: any) => {
    if (postAttachments.length >= 3) {
      alert('Máximo 3 adjuntos por publicación')
      return
    }

    if (type === 'youtube' || type === 'link') {
      setPendingAttachmentType(type)
      setShowYouTubeModal(true)
    } else if (type === 'poll') {
      if (postAttachments.some(att => att.type === 'poll')) {
        alert('Solo puedes agregar una encuesta por publicación')
        return
      }
      setShowPollModal(true)
    } else {
      const newAttachment = {
        type,
        data,
        id: `${type}-${Date.now()}-${Math.random()}`
      }
      setPostAttachments(prev => [...prev, newAttachment])
    }
  }

  const handleYouTubeLinkConfirm = (url: string, type: 'youtube' | 'link') => {
    if (postAttachments.length >= 3) {
      alert('Máximo 3 adjuntos por publicación')
      setShowYouTubeModal(false)
      setPendingAttachmentType(null)
      return
    }

    const newAttachment = {
      type,
      data: { url, name: type === 'youtube' ? 'Video de YouTube' : 'Enlace web' },
      id: `${type}-${Date.now()}-${Math.random()}`
    }
    setPostAttachments(prev => [...prev, newAttachment])
    setShowYouTubeModal(false)
    setPendingAttachmentType(null)
  }

  const handlePollConfirm = (pollData: any) => {
    if (postAttachments.some(att => att.type === 'poll')) {
      alert('Solo puedes agregar una encuesta por publicación')
      setShowPollModal(false)
      return
    }

    if (postAttachments.length >= 3) {
      alert('Máximo 3 adjuntos por publicación')
      setShowPollModal(false)
      return
    }

    const newAttachment = {
      type: 'poll',
      data: pollData,
      id: `poll-${Date.now()}-${Math.random()}`
    }
    setPostAttachments(prev => [...prev, newAttachment])
    setShowPollModal(false)
  }

  const handleRemoveAttachment = (id: string) => {
    setPostAttachments(prev => prev.filter(att => att.id !== id))
  }

  const handlePasteImage = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault()
        
        const file = item.getAsFile()
        if (!file) return

        const validImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
        if (!validImageTypes.includes(file.type)) {
          alert('Tipo de imagen no soportado. Por favor, usa PNG, JPEG, GIF o WebP.')
          return
        }

        const maxSize = 10 * 1024 * 1024 // 10MB
        if (file.size > maxSize) {
          alert('La imagen es demasiado grande. El tamaño máximo es 10MB.')
          return
        }

        if (postAttachments.length >= 3) {
          alert('Máximo 3 adjuntos por publicación')
          return
        }

        const reader = new FileReader()
        reader.onload = (event) => {
          const data = {
            file,
            url: event.target?.result,
            name: file.name || `imagen-${Date.now()}.${file.type.split('/')[1]}`,
            size: file.size,
            mimeType: file.type,
            type: 'image'
          }
          
          const newAttachment = {
            type: 'image',
            data,
            id: `image-${Date.now()}-${Math.random()}`
          }
          setPostAttachments(prev => [...prev, newAttachment])
        }
        reader.readAsDataURL(file)
        break
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!content.trim()) {
      setError('El contenido no puede estar vacío')
      return
    }

    // No permitir guardar si se está procesando un attachment
    if (isProcessingAttachment) {
      setError('Por favor espera a que termine de subir el archivo')
      return
    }

    setIsSaving(true)

    try {
      // Procesar attachments si hay nuevos
      let attachment_url = initialPost.attachment_url || null
      let attachment_type = initialPost.attachment_type || null
      let attachment_data = initialPost.attachment_data || null

      if (postAttachments.length > 0) {
        // Procesar attachments que tienen archivos nuevos
        const hasNewFiles = postAttachments.some(att => att.data?.file)
        
        if (hasNewFiles) {
          // Procesar cada attachment con archivo
          const processedAttachments = []
          const filesToProcess = postAttachments.filter(att => att.data?.file)
          
          
          for (const att of postAttachments) {
            if (att.data?.file) {
              try {

                setIsProcessingAttachment(true)
                const processed = await processAttachment({
                  type: att.type,
                  ...att.data
                })
                setIsProcessingAttachment(false)
                
                if (processed) {

                  processedAttachments.push(processed)
                } else {
                  console.error(`❌ Error: processAttachment retornó null para ${att.type}`)
                  setIsProcessingAttachment(false)
                  throw new Error(`Error al procesar el adjunto ${att.type}. Por favor, intenta de nuevo.`)
                }
              } catch (attError) {
                setIsProcessingAttachment(false)
                console.error('❌ Error procesando attachment:', attError)
                const errorMessage = attError instanceof Error 
                  ? attError.message 
                  : `Error al subir el archivo ${att.data?.name || att.type}. Por favor, intenta de nuevo.`
                throw new Error(errorMessage)
              }
            } else {
              // Para attachments sin archivo (poll, youtube, link), usar datos directamente
              processedAttachments.push({
                attachment_url: att.type === 'youtube' || att.type === 'link' ? att.data.url : null,
                attachment_type: att.type,
                attachment_data: att.data
              })
            }
          }
          
          // Verificar que se procesaron todos los attachments con archivo
          if (filesToProcess.length > 0 && processedAttachments.length < filesToProcess.length) {
            throw new Error(`Solo se procesaron ${processedAttachments.length} de ${filesToProcess.length} archivo(s). Por favor, intenta de nuevo.`)
          }

          // Si hay un solo attachment procesado
          if (processedAttachments.length === 1) {
            attachment_url = processedAttachments[0].attachment_url
            attachment_type = processedAttachments[0].attachment_type
            attachment_data = processedAttachments[0].attachment_data
          } else if (processedAttachments.length > 1) {
            // Múltiples attachments
            attachment_type = processedAttachments[0].attachment_type
            attachment_data = {
              isMultiple: true,
              attachments: processedAttachments.map(att => ({
                attachment_url: att.attachment_url,
                attachment_type: att.attachment_type,
                attachment_data: att.attachment_data
              }))
            }
            attachment_url = processedAttachments[0]?.attachment_url || null
          }
        } else {
          // Solo attachments sin archivo (poll, youtube, link)
          const firstAttachment = postAttachments[0]
          if (firstAttachment.type === 'poll') {
            attachment_type = 'poll'
            attachment_data = firstAttachment.data
            attachment_url = null
          } else if (firstAttachment.type === 'youtube' || firstAttachment.type === 'link') {
            attachment_type = firstAttachment.type
            attachment_url = firstAttachment.data.url
            attachment_data = firstAttachment.data
          }
        }
      } else {
        // Si no hay attachments, eliminar los existentes
        attachment_url = null
        attachment_type = null
        attachment_data = null
      }

      // Actualizar el post
      const response = await fetch(`/api/communities/${communitySlug}/posts/${initialPost.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          content: content.trim(),
          attachment_url,
          attachment_type,
          attachment_data
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar el post')
      }

      const result = await response.json()
      
      // Cerrar modal y actualizar con el post editado
      const updatedPost = result.post || {
        ...initialPost,
        content: content.trim(),
        attachment_url,
        attachment_type,
        attachment_data,
        is_edited: true,
        updated_at: new Date().toISOString()
      }
      
      onSave(updatedPost)
      handleClose()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar el post'
      setError(errorMessage)
      console.error('Error updating post:', err)
      // NO cerrar el modal si hay error - dejar que el usuario vea el error y pueda intentar de nuevo
    } finally {
      setIsSaving(false)
    }
  }

  // No renderizar nada si no está montado o no hay post válido
  if (!mounted || !initialPost?.id || !internalIsOpen) return null

  const handleClose = () => {
    // No permitir cerrar si se está procesando o guardando
    if (!isSaving && !isProcessingAttachment) {
      setInternalIsOpen(false)
      onClose()
    }
  }

  const modalContent = (
    <>
      <AnimatePresence mode="wait">
        {internalIsOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => {
                e.stopPropagation()
                handleClose()
              }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              style={{ 
                zIndex: 99998,
                pointerEvents: isSaving || isProcessingAttachment ? 'none' : 'auto',
                cursor: isSaving || isProcessingAttachment ? 'not-allowed' : 'pointer'
              }}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none"
              style={{ zIndex: 99999 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div 
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Editar Post
                  </h2>
                  <button
                    onClick={handleClose}
                    disabled={isSaving || isProcessingAttachment}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                  )}

                  {/* Indicador de carga de attachments */}
                  {isProcessingAttachment && (
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                          Subiendo archivo, por favor espera...
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Contenido */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Contenido *
                      </label>
                      <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onPaste={handlePasteImage}
                        rows={8}
                        required
                        className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="¿Qué estás pensando?"
                        disabled={isSaving || isProcessingAttachment}
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {content.length} caracteres
                      </p>
                    </div>

                    {/* Preview de adjuntos */}
                    {postAttachments.length > 0 && (
                      <div className="space-y-2">
                        {postAttachments.map((attachment) => (
                          <AttachmentPreview
                            key={attachment.id}
                            type={attachment.type}
                            data={attachment.data}
                            onRemove={() => handleRemoveAttachment(attachment.id)}
                          />
                        ))}
                      </div>
                    )}

                    {/* Botones de adjuntos */}
                    <div>
                      <InlineAttachmentButtons
                        onAttachmentSelect={handleAttachmentSelect}
                        currentAttachmentsCount={postAttachments.length}
                        maxAttachments={3}
                      />
                    </div>
                  </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSaving || isProcessingAttachment}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessingAttachment ? 'Procesando...' : 'Cancelar'}
                  </button>
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={isSaving || isProcessingAttachment || !content.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSaving || isProcessingAttachment ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {isProcessingAttachment ? 'Subiendo archivo...' : 'Guardando...'}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Guardar cambios
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modales de adjuntos - con z-index alto para que aparezcan sobre el modal de edición */}
      {showYouTubeModal && (
        <div style={{ zIndex: 100000, position: 'fixed' }}>
          <YouTubeLinkModal
            isOpen={showYouTubeModal}
            onClose={() => {
              setShowYouTubeModal(false)
              setPendingAttachmentType(null)
            }}
            onConfirm={handleYouTubeLinkConfirm}
            type={pendingAttachmentType as 'youtube' | 'link' || 'link'}
          />
        </div>
      )}

      {showPollModal && (
        <div style={{ zIndex: 100000, position: 'fixed' }}>
          <PollModal
            isOpen={showPollModal}
            onClose={() => setShowPollModal(false)}
            onConfirm={handlePollConfirm}
          />
        </div>
      )}
    </>
  )

  // Renderizar usando portal directamente en el body para evitar problemas de z-index
  return createPortal(modalContent, document.body)
}
