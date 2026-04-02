import { AnimatePresence } from 'framer-motion'
import { MessageSquare } from 'lucide-react'
import { ChatMessage } from './ChatMessage'
import type { HierarchyChatMessage } from '../../../types/hierarchy.types'
import type { FileAttachment } from './types'

interface ChatMessagesProps {
  messages: HierarchyChatMessage[]
  userId: string | undefined
  editingMessageId: string | null
  editContent: string
  onEditChange: (value: string) => void
  onEditSubmit: (messageId: string) => void
  onEditCancel: () => void
  onStartEdit: (message: HierarchyChatMessage) => void
  onDelete: (messageId: string) => void
  onImageClick: (url: string, name: string) => void
  onDownload: (url: string, name: string) => void
  getAttachment: (message: HierarchyChatMessage) => FileAttachment | null
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  messagesContainerRef: React.RefObject<HTMLDivElement | null>
  primaryColor: string
  accentColor: string
  isDark: boolean
}

export function ChatMessages({
  messages,
  userId,
  editingMessageId,
  editContent,
  onEditChange,
  onEditSubmit,
  onEditCancel,
  onStartEdit,
  onDelete,
  onImageClick,
  onDownload,
  getAttachment,
  messagesEndRef,
  messagesContainerRef,
  primaryColor,
  accentColor,
  isDark
}: ChatMessagesProps) {
  const getSenderName = (message: HierarchyChatMessage) => {
    if (message.sender) {
      return (
        message.sender.display_name ||
        `${message.sender.first_name || ''} ${message.sender.last_name || ''}`.trim() ||
        message.sender.email
      )
    }
    return 'Usuario'
  }

  const getSenderAvatar = (message: HierarchyChatMessage) => {
    return message.sender?.profile_picture_url || null
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (messages.length === 0) {
    return (
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4"
        style={{ backgroundColor: isDark ? '#0F1419' : '#F8FAFC' }}
      >
        <div className="flex flex-col items-center justify-center h-full">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <MessageSquare className="w-10 h-10" style={{ color: primaryColor }} />
          </div>
          <p className="font-medium" style={{ color: isDark ? '#FFFFFF' : '#1E293B' }}>
            No hay mensajes aún
          </p>
          <p className="text-sm mt-1" style={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#64748B' }}>
            ¡Sé el primero en escribir!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto p-4 space-y-3"
      style={{ backgroundColor: isDark ? '#0F1419' : '#F8FAFC' }}
    >
      <AnimatePresence initial={false}>
        {messages.map((message, index) => {
          const isOwnMessage = message.sender_id === userId
          const isEditing = editingMessageId === message.id
          const showAvatar = !isOwnMessage && (index === 0 || messages[index - 1]?.sender_id !== message.sender_id)

          return (
            <ChatMessage
              key={message.id}
              message={message}
              isOwnMessage={isOwnMessage}
              showAvatar={showAvatar}
              isEditing={isEditing}
              editContent={editContent}
              onEditChange={onEditChange}
              onEditSubmit={onEditSubmit}
              onEditCancel={onEditCancel}
              onStartEdit={onStartEdit}
              onDelete={onDelete}
              onImageClick={onImageClick}
              onDownload={onDownload}
              getAttachment={getAttachment}
              getSenderName={getSenderName}
              getSenderAvatar={getSenderAvatar}
              getInitials={getInitials}
              formatTime={formatTime}
              formatFileSize={formatFileSize}
              primaryColor={primaryColor}
              accentColor={accentColor}
              isDark={isDark}
            />
          )
        })}
      </AnimatePresence>
      <div ref={messagesEndRef} />
    </div>
  )
}
