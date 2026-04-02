import { useState, useEffect, useRef, useCallback } from 'react'
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
  entityType: 'region' | 'zone' | 'team'
  entityId: string
  chatType: HierarchyChatType
}

export const useChatLogic = ({ entityType, entityId, chatType }: UseChatLogicProps) => {
  const { user } = useAuth()

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
        } else {
          setError('No se pudo crear o cargar el chat.')
        }
      } catch (error: any) {
        setError(error?.message || error?.error || 'Error al cargar el chat.')
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
          throw new Error(uploadResult.error || 'Error al subir el archivo')
        }
      }

      if (!finalContent && !metadata) {
        setIsSending(false)
        return
      }

      setMessageContent('')
      removeSelectedFile()

      const newMessage = await HierarchyChatsService.sendMessage(chat.id, {
        content: finalContent || (metadata ? '📎 Archivo adjunto' : ''),
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
      alert(error instanceof Error ? error.message : 'Error al enviar el mensaje')
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
    if (!confirm('¿Estás seguro de que quieres eliminar este mensaje?')) return

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
    if (message.metadata && typeof message.metadata === 'object') {
      const attachment = (message.metadata as any).attachment
      if (attachment && attachment.url) {
        return {
          url: attachment.url as string,
          name: attachment.name as string || 'Archivo',
          size: attachment.size as number,
          type: attachment.type as string || attachment.mimeType as string || 'application/octet-stream',
          mimeType: attachment.mimeType as string || attachment.type as string || 'application/octet-stream'
        }
      }
    }
    return null
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
