import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { supabaseStorageService } from '../../../../../../core/services/supabaseStorage'
import { useAuth } from '../../../../../auth/hooks/useAuth'
import { HierarchyChatsService } from '../../../../services/hierarchyChats.service'
import type {
  HierarchyChat,
  HierarchyChatMessage,
  HierarchyChatParticipant,
  HierarchyChatType
} from '../../../../types/hierarchy.types'
import type { EmojiCategory, FileAttachment } from '../types'

interface UseChatLogicProps {
  entityType: 'region' | 'zone' | 'team' | 'node'
  entityId: string
  chatType: HierarchyChatType
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  if (error && typeof error === 'object' && 'error' in error && typeof error.error === 'string') {
    return error.error
  }

  return fallback
}

function toFileAttachment(metadata: HierarchyChatMessage['metadata'], fallbackName: string): FileAttachment | null {
  if (!metadata || typeof metadata !== 'object' || !('attachment' in metadata)) {
    return null
  }

  const attachment = metadata.attachment
  if (!attachment || typeof attachment !== 'object') {
    return null
  }

  const attachmentRecord = attachment as Record<string, unknown>
  if (typeof attachmentRecord.url !== 'string') {
    return null
  }

  const fallbackMimeType =
    typeof attachmentRecord.mimeType === 'string'
      ? attachmentRecord.mimeType
      : typeof attachmentRecord.type === 'string'
        ? attachmentRecord.type
        : 'application/octet-stream'

  return {
    url: attachmentRecord.url,
    name:
      typeof attachmentRecord.name === 'string' && attachmentRecord.name.trim()
        ? attachmentRecord.name
        : fallbackName,
    size: typeof attachmentRecord.size === 'number' ? attachmentRecord.size : 0,
    type: typeof attachmentRecord.type === 'string' ? attachmentRecord.type : fallbackMimeType,
    mimeType: fallbackMimeType,
  }
}

export const useChatLogic = ({ entityType, entityId, chatType }: UseChatLogicProps) => {
  const { user } = useAuth()
  const { t } = useTranslation('business')

  const [chat, setChat] = useState<HierarchyChat | null>(null)
  const [messages, setMessages] = useState<HierarchyChatMessage[]>([])
  const [participants, setParticipants] = useState<HierarchyChatParticipant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [messageContent, setMessageContent] = useState('')
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [activeEmojiCategory, setActiveEmojiCategory] = useState<EmojiCategory>('caras')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)

  const [imageModal, setImageModal] = useState<{
    url: string
    name: string
  } | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)

  // Cerrar emoji picker al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Cerrar modal con tecla ESC
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && imageModal) {
        setImageModal(null)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [imageModal])

  // Cargar o crear chat
  useEffect(() => {
    const loadChat = async () => {
      try {
        setIsLoading(true)

        const existingChats = await HierarchyChatsService.getChats(
          entityType,
          entityId,
          chatType
        )

        let chatToUse: HierarchyChat | null = null

        if (existingChats.length > 0) {
          chatToUse = existingChats[0]
        } else {
          const result = await HierarchyChatsService.getOrCreateChat({
            entity_type: entityType,
            entity_id: entityId,
            chat_type: chatType
          })

          if (result) {
            chatToUse = result.chat
          }
        }

        if (chatToUse) {
          setChat(chatToUse)
          await loadMessages(chatToUse.id)
          await markAsRead(chatToUse.id)
          setError(null)
          setError(t('hierarchy.chat.errors.create'))
        }
      } catch (error: unknown) {
        setError(getErrorMessage(error, t('hierarchy.chat.errors.load')))
      } finally {
        setIsLoading(false)
      }
    }

    loadChat()
  }, [entityType, entityId, chatType])

  const loadMessages = async (chatId: string) => {
    try {
      const result = await HierarchyChatsService.getChatWithMessages(chatId, { limit: 50 })
      if (result) {
        setMessages(result.messages || [])
        setParticipants(result.participants || [])
      }
    } catch (error) {
      console.error('Error cargando mensajes:', error)
    }
  }

  const markAsRead = async (chatId: string) => {
    try {
      await HierarchyChatsService.markAsRead(chatId)
    } catch (error) {
      console.error('Error marcando como leído:', error)
    }
  }

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)

      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setFilePreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setFilePreview(null)
      }
    }
  }

  const removeSelectedFile = () => {
    setSelectedFile(null)
    setFilePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const insertEmoji = (emoji: string) => {
    setMessageContent(prev => prev + emoji)
    setShowEmojiPicker(false)
  }

  const handleSendMessage = async () => {
    if (!chat || (!messageContent.trim() && !selectedFile) || isSending) return

    const content = messageContent.trim()
    setIsSending(true)

    try {
      let metadata: Record<string, unknown> | undefined
      let finalContent = content

      if (selectedFile) {
        const bucket = supabaseStorageService.getBucketForType(
          selectedFile.type.startsWith('image/') ? 'image' :
            selectedFile.type.startsWith('video/') ? 'video' : 'document',
          'hierarchy-chats'
        )
        const folder = ''

        const uploadResult = await supabaseStorageService.uploadFile(
          selectedFile,
          bucket,
          folder
        )

        if (uploadResult.success && uploadResult.url) {
          metadata = {
            attachment: {
              url: uploadResult.url,
              name: selectedFile.name,
              size: selectedFile.size,
              type: selectedFile.type,
              mimeType: selectedFile.type
            }
          }

          finalContent = content
        } else {
          throw new Error(uploadResult.error || t('hierarchy.chat.errors.upload'))
        }
      }

      if (!finalContent && !metadata) {
        setIsSending(false)
        return
      }

      setMessageContent('')
      removeSelectedFile()

      const newMessage = await HierarchyChatsService.sendMessage(chat.id, {
        content: finalContent || (metadata ? t('hierarchy.chat.attachment') : ''),
        message_type: selectedFile ? 'file' : 'text',
        metadata
      })

      if (newMessage) {
        setMessages(prev => [...prev, newMessage])
        await markAsRead(chat.id)
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error)
      setMessageContent(content)
      setError(error instanceof Error ? error.message : t('hierarchy.chat.errors.send'))
    } finally {
      setIsSending(false)
    }
  }

  const handleEditMessage = async (messageId: string) => {
    if (!chat || !editContent.trim()) return

    try {
      const updatedMessage = await HierarchyChatsService.updateMessage(
        chat.id,
        messageId,
        { content: editContent.trim() }
      )

      if (updatedMessage) {
        setMessages(prev =>
          prev.map(msg => (msg.id === messageId ? updatedMessage : msg))
        )
        setEditingMessageId(null)
        setEditContent('')
      }
    } catch (error) {
      console.error('Error editando mensaje:', error)
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!chat) return

    try {
      const success = await HierarchyChatsService.deleteMessage(chat.id, messageId)
      if (success) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId))
      }
    } catch (error) {
      console.error('Error eliminando mensaje:', error)
    }
  }

  const startEditing = (message: HierarchyChatMessage) => {
    setEditingMessageId(message.id)
    setEditContent(message.content)
  }

  const getMessageAttachment = (message: HierarchyChatMessage): FileAttachment | null => {
    return toFileAttachment(message.metadata, t('hierarchy.chat.file'))
  }

  // Funciones wrappers para compatibilidad
  const uploadFile = async (file: File) => {
    setSelectedFile(file)
    // La lógica de subida real ocurre al enviar el mensaje en handleSendMessage
    // Esto es diferente a lo que espera ChatInput probablemente, así que ajustaremos la lógica
    // Si ChatInput espera subir inmediatamente, necesitamos cambiar handleSendMessage
    // Por ahora, asumimos que ChatInput llama a onUpload con el archivo seleccionado para previsualizar
  }

  const loadMoreMessages = async () => {
    // Implementar paginación real si es necesario
  }

  return {
    // Estado
    chat,
    messages,
    participants,
    loading: isLoading, // Renamed to match component expectation
    sending: isSending, // Renamed
    currentUser: user,  // Renamed
    messageContent,
    editingMessageId,
    editContent,
    error,
    showEmojiPicker,
    activeEmojiCategory,
    selectedFile,
    filePreview,
    imageModal,

    // Refs
    messagesEndRef,
    messagesContainerRef,
    fileInputRef,
    emojiPickerRef,

    // Setters
    setMessageContent,
    setEditingMessageId,
    setEditContent,
    setShowEmojiPicker,
    setActiveEmojiCategory,
    setImageModal,

    // Funciones
    handleFileSelect,
    removeSelectedFile,
    insertEmoji,
    handleSendMessage,
    handleEditMessage,
    handleDeleteMessage,
    startEditing,
    getMessageAttachment,

    // Nuevas funciones expuestas
    uploadFile,
    loadMoreMessages,
    hasMore: false, // Placeholder
    markAsRead
  }
}
