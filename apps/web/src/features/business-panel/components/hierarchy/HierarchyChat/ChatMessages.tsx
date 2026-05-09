import type { RefObject } from 'react'
import { AnimatePresence } from 'framer-motion'
import { MessageSquare } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { HierarchyChatMessage } from '../../../types/hierarchy.types'
import { useBusinessPanelTheme } from '../../../hooks/useBusinessPanelTheme'
import { ChatMessage } from './ChatMessage'
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
  messagesEndRef: RefObject<HTMLDivElement>
  messagesContainerRef: RefObject<HTMLDivElement>
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
}: ChatMessagesProps) {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()

  const getSenderName = (message: HierarchyChatMessage) => {
    if (message.sender) {
      return (
        message.sender.display_name
        || `${message.sender.first_name || ''} ${message.sender.last_name || ''}`.trim()
        || message.sender.email
      )
    }
    return t('hierarchy.chat.user')
  }

  const getSenderAvatar = (message: HierarchyChatMessage) => {
    return message.sender?.profile_picture_url || null
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((segment) => segment[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
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
        style={{ backgroundColor: theme.panelBg }}
      >
        <div className="flex h-full flex-col items-center justify-center">
          <div
            className="mb-4 flex h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: theme.hoverBg }}
          >
            <MessageSquare className="h-10 w-10" style={{ color: theme.primaryColor }} />
          </div>
          <p className="font-medium" style={{ color: theme.textColor }}>
            {t('hierarchy.chat.empty')}
          </p>
          <p className="mt-1 text-sm" style={{ color: theme.subtextColor }}>
            {t('hierarchy.chat.beTheFirst')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 space-y-3 overflow-y-auto p-4"
      style={{ backgroundColor: theme.panelBg }}
    >
      <AnimatePresence initial={false}>
        {messages.map((message, index) => {
          const isOwnMessage = message.sender_id === userId
          const isEditing = editingMessageId === message.id
          const showAvatar =
            !isOwnMessage && (index === 0 || messages[index - 1]?.sender_id !== message.sender_id)

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
            />
          )
        })}
      </AnimatePresence>
      <div ref={messagesEndRef} />
    </div>
  )
}
