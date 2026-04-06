'use client'

import { useState, useEffect } from 'react'
import { useAttachments } from '../../hooks/useAttachments'
import type { ProcessedAttachment } from '../../hooks/useAttachments'
import type { AttachmentData } from '@/core/services/supabaseStorage'
import type {
  InlineAttachmentPayload,
  InlineAttachmentTypeId,
} from '../InlineAttachmentButtons/InlineAttachmentButtons'
import type { PollAttachmentData } from '../AttachmentModals/PollModal'

interface EditablePost {
  id: string
  content: string
  attachment_url?: string | null
  attachment_type?: string | null
  attachment_data?: Record<string, unknown> | null
  is_edited?: boolean
  updated_at?: string
}

interface EditPostResponse {
  post?: EditablePost
  error?: string
}

interface DraftAttachment {
  type: InlineAttachmentTypeId
  data: InlineAttachmentPayload
  id: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isEditablePost(value: unknown): value is EditablePost {
  return isRecord(value) && typeof value.id === 'string' && typeof value.content === 'string'
}

function getStringValue(data: Record<string, unknown> | null | undefined, key: string): string | undefined {
  if (!data) return undefined
  const value = data[key]
  return typeof value === 'string' ? value : undefined
}

function getAttachmentPayload(
  value: Record<string, unknown> | null | undefined,
  fallbackUrl?: string | null
): InlineAttachmentPayload {
  if (value) return value
  return fallbackUrl ? { url: fallbackUrl } : {}
}

function hasFileAttachment(data: InlineAttachmentPayload): data is InlineAttachmentPayload & { file: File } {
  return data.file instanceof File
}

function getAttachmentInput(type: InlineAttachmentTypeId, data: InlineAttachmentPayload): AttachmentData {
  const optionsValue = data.options
  return {
    type,
    file: data.file instanceof File ? data.file : undefined,
    url: typeof data.url === 'string' ? data.url : undefined,
    name: typeof data.name === 'string' ? data.name : undefined,
    size: typeof data.size === 'number' ? data.size : undefined,
    mimeType: typeof data.mimeType === 'string' ? data.mimeType : undefined,
    question: typeof data.question === 'string' ? data.question : undefined,
    options:
      Array.isArray(optionsValue) && optionsValue.every((option) => typeof option === 'string')
        ? optionsValue
        : undefined,
    duration: typeof data.duration === 'number' ? data.duration : undefined,
    videoId: typeof data.videoId === 'string' ? data.videoId : undefined,
    title: typeof data.title === 'string' ? data.title : undefined,
    thumbnail: typeof data.thumbnail === 'string' ? data.thumbnail : undefined,
  }
}

function parseEditPostResponse(value: unknown): EditPostResponse {
  if (!isRecord(value)) return {}
  return {
    post: isEditablePost(value.post) ? value.post : undefined,
    error: typeof value.error === 'string' ? value.error : undefined,
  }
}

interface UseEditPostFormStateProps {
  isOpen: boolean
  post: EditablePost
  communitySlug: string
  onSave: (updatedPost?: EditablePost) => void
  onClose: () => void
}

export function useEditPostFormState({
  isOpen,
  post,
  communitySlug,
  onSave,
  onClose,
}: UseEditPostFormStateProps) {
  const [initialPost, setInitialPost] = useState(post)
  const [internalIsOpen, setInternalIsOpen] = useState(isOpen)
  const [content, setContent] = useState(post.content || '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [postAttachments, setPostAttachments] = useState<DraftAttachment[]>([])
  const [showYouTubeModal, setShowYouTubeModal] = useState(false)
  const [showPollModal, setShowPollModal] = useState(false)
  const [pendingAttachmentType, setPendingAttachmentType] = useState<'youtube' | 'link' | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isProcessingAttachment, setIsProcessingAttachment] = useState(false)

  const { processAttachment } = useAttachments()

  useEffect(() => {
    if (isOpen && post?.id) {
      setInternalIsOpen(true)
      setInitialPost(post)
    } else if (!isOpen && !isSaving && !isProcessingAttachment) {
      setInternalIsOpen(false)
    }
  }, [isOpen, post?.id, isSaving, isProcessingAttachment])

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (isOpen && initialPost?.id) {
      setContent(initialPost.content || '')
      setError(null)
      setIsProcessingAttachment(false)

      if (initialPost.attachment_type && initialPost.attachment_url) {
        const existingAttachment = {
          type: initialPost.attachment_type as InlineAttachmentTypeId,
          data: getAttachmentPayload(initialPost.attachment_data, initialPost.attachment_url),
          id: `existing-${initialPost.attachment_type}-${Date.now()}`,
        }
        setPostAttachments([existingAttachment])
      } else {
        setPostAttachments([])
      }
    }
  }, [isOpen, initialPost?.id])

  const handleClose = () => {
    if (!isSaving && !isProcessingAttachment) {
      setInternalIsOpen(false)
      onClose()
    }
  }

  const handleAttachmentSelect = (type: InlineAttachmentTypeId, data: InlineAttachmentPayload | null) => {
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
      const newAttachment = { type, data: data ?? {}, id: `${type}-${Date.now()}-${Math.random()}` }
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
      id: `${type}-${Date.now()}-${Math.random()}`,
    }
    setPostAttachments(prev => [...prev, newAttachment])
    setShowYouTubeModal(false)
    setPendingAttachmentType(null)
  }

  const handlePollConfirm = (pollData: PollAttachmentData) => {
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
    const newAttachment = { type: 'poll', data: pollData, id: `poll-${Date.now()}-${Math.random()}` }
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
        if (file.size > 10 * 1024 * 1024) {
          alert('La imagen es demasiado grande. El tamaño máximo es 10MB.')
          return
        }
        if (postAttachments.length >= 3) {
          alert('Máximo 3 adjuntos por publicación')
          return
        }

        const reader = new FileReader()
        reader.onload = (event) => {
          const data: InlineAttachmentPayload = {
            file,
            url: typeof event.target?.result === 'string' ? event.target.result : null,
            name: file.name || `imagen-${Date.now()}.${file.type.split('/')[1]}`,
            size: file.size,
            mimeType: file.type,
            type: 'image',
          }
          const newAttachment = { type: 'image', data, id: `image-${Date.now()}-${Math.random()}` }
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
    if (isProcessingAttachment) {
      setError('Por favor espera a que termine de subir el archivo')
      return
    }

    setIsSaving(true)

    try {
      let attachment_url = initialPost.attachment_url || null
      let attachment_type = initialPost.attachment_type || null
      let attachment_data = initialPost.attachment_data || null

      if (postAttachments.length > 0) {
        const hasNewFiles = postAttachments.some(att => hasFileAttachment(att.data))

        if (hasNewFiles) {
          const processedAttachments: ProcessedAttachment[] = []
          const filesToProcess = postAttachments.filter(att => hasFileAttachment(att.data))

          for (const att of postAttachments) {
            if (hasFileAttachment(att.data)) {
              try {
                setIsProcessingAttachment(true)
                const processed = await processAttachment(getAttachmentInput(att.type, att.data))
                setIsProcessingAttachment(false)
                if (processed) {
                  processedAttachments.push(processed)
                } else {
                  setIsProcessingAttachment(false)
                  throw new Error(`Error al procesar el adjunto ${att.type}. Por favor, intenta de nuevo.`)
                }
              } catch (attError) {
                setIsProcessingAttachment(false)
                const errorMessage =
                  attError instanceof Error
                    ? attError.message
                    : `Error al subir el archivo ${getStringValue(att.data, 'name') || att.type}. Por favor, intenta de nuevo.`
                throw new Error(errorMessage)
              }
            } else {
              processedAttachments.push({
                attachment_url:
                  att.type === 'youtube' || att.type === 'link'
                    ? getStringValue(att.data, 'url') || null
                    : null,
                attachment_type: att.type,
                attachment_data: att.data,
              })
            }
          }

          if (filesToProcess.length > 0 && processedAttachments.length < filesToProcess.length) {
            throw new Error(`Solo se procesaron ${processedAttachments.length} de ${filesToProcess.length} archivo(s). Por favor, intenta de nuevo.`)
          }

          if (processedAttachments.length === 1) {
            attachment_url = processedAttachments[0].attachment_url
            attachment_type = processedAttachments[0].attachment_type
            attachment_data = processedAttachments[0].attachment_data
          } else if (processedAttachments.length > 1) {
            attachment_type = processedAttachments[0].attachment_type
            attachment_data = {
              isMultiple: true,
              attachments: processedAttachments.map(att => ({
                attachment_url: att.attachment_url,
                attachment_type: att.attachment_type,
                attachment_data: att.attachment_data,
              })),
            }
            attachment_url = processedAttachments[0]?.attachment_url || null
          }
        } else {
          const firstAttachment = postAttachments[0]
          if (firstAttachment.type === 'poll') {
            attachment_type = 'poll'
            attachment_data = firstAttachment.data
            attachment_url = null
          } else if (firstAttachment.type === 'youtube' || firstAttachment.type === 'link') {
            attachment_type = firstAttachment.type
            attachment_url = getStringValue(firstAttachment.data, 'url') || null
            attachment_data = firstAttachment.data
          }
        }
      } else {
        attachment_url = null
        attachment_type = null
        attachment_data = null
      }

      const response = await fetch(`/api/communities/${communitySlug}/posts/${initialPost.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: content.trim(), attachment_url, attachment_type, attachment_data }),
      })

      if (!response.ok) {
        const errorData = parseEditPostResponse(await response.json())
        throw new Error(errorData.error || 'Error al actualizar el post')
      }

      const result = parseEditPostResponse(await response.json())
      const updatedPost = result.post || {
        ...initialPost,
        content: content.trim(),
        attachment_url,
        attachment_type,
        attachment_data,
        is_edited: true,
        updated_at: new Date().toISOString(),
      }

      onSave(updatedPost)
      handleClose()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar el post'
      setError(errorMessage)
      console.error('Error updating post:', err)
    } finally {
      setIsSaving(false)
    }
  }

  return {
    initialPost,
    internalIsOpen,
    content,
    setContent,
    isSaving,
    error,
    postAttachments,
    showYouTubeModal,
    setShowYouTubeModal,
    showPollModal,
    setShowPollModal,
    pendingAttachmentType,
    setPendingAttachmentType,
    mounted,
    isProcessingAttachment,
    handleClose,
    handleAttachmentSelect,
    handleYouTubeLinkConfirm,
    handlePollConfirm,
    handleRemoveAttachment,
    handlePasteImage,
    handleSubmit,
  }
}

export type { EditablePost, DraftAttachment }
