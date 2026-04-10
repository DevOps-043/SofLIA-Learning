import { motion } from 'framer-motion'
import Image from 'next/image'
import {
  Check,
  Download,
  Edit2,
  File as FileIcon,
  Image as ImageIcon,
  Maximize2,
  Paperclip,
  Trash2,
  X,
} from 'lucide-react'
import type { HierarchyChatMessage } from '../../../types/hierarchy.types'
import { useBusinessPanelTheme } from '../../../hooks/useBusinessPanelTheme'
import type { FileAttachment } from './types'

interface ChatMessageProps {
  message: HierarchyChatMessage
  isOwnMessage: boolean
  showAvatar: boolean
  isEditing: boolean
  editContent: string
  onEditChange: (value: string) => void
  onEditSubmit: (messageId: string) => void
  onEditCancel: () => void
  onStartEdit: (message: HierarchyChatMessage) => void
  onDelete: (messageId: string) => void
  onImageClick: (url: string, name: string) => void
  onDownload: (url: string, name: string) => void
  getAttachment: (message: HierarchyChatMessage) => FileAttachment | null
  getSenderName: (message: HierarchyChatMessage) => string
  getSenderAvatar: (message: HierarchyChatMessage) => string | null
  getInitials: (name: string) => string
  formatTime: (dateString: string) => string
  formatFileSize: (bytes: number) => string
}

function sanitizeMessageContent(content: string, hasAttachment: boolean) {
  if (!hasAttachment) {
    return content.trim()
  }

  const withoutPlaceholder = content.replace(/archivo adjunto/gi, '').trim()
  const withoutLeadingSymbols = withoutPlaceholder.replace(/^[^\p{L}\p{N}]+/gu, '').trim()
  return withoutLeadingSymbols
}

export function ChatMessage({
  message,
  isOwnMessage,
  showAvatar,
  isEditing,
  editContent,
  onEditChange,
  onEditSubmit,
  onEditCancel,
  onStartEdit,
  onDelete,
  onImageClick,
  onDownload,
  getAttachment,
  getSenderName,
  getSenderAvatar,
  getInitials,
  formatTime,
  formatFileSize,
}: ChatMessageProps) {
  const theme = useBusinessPanelTheme()
  const attachment = getAttachment(message)
  const isImage = Boolean(attachment && attachment.mimeType.startsWith('image/'))
  const textContent = sanitizeMessageContent(message.content, Boolean(attachment))

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return ImageIcon
    return FileIcon
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`flex items-end gap-2 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
    >
      {!isOwnMessage && (
        <div className={`flex-shrink-0 ${showAvatar ? 'visible' : 'invisible'}`}>
          {getSenderAvatar(message) ? (
            <Image
              src={getSenderAvatar(message)!}
              alt={getSenderName(message)}
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{
                background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
              }}
            >
              <span
                className="text-xs font-medium"
                style={{ color: theme.onPrimaryColor }}
              >
                {getInitials(getSenderName(message))}
              </span>
            </div>
          )}
        </div>
      )}

      <div
        className={`flex max-w-[70%] flex-col gap-1 ${isOwnMessage ? 'items-end' : 'items-start'}`}
      >
        {!isOwnMessage && showAvatar && (
          <span
            className="ml-1 text-xs font-medium"
            style={{ color: theme.textColor }}
          >
            {getSenderName(message)}
          </span>
        )}

        {isEditing ? (
          <div className="flex w-full max-w-md gap-2">
            <input
              type="text"
              value={editContent}
              onChange={(event) => onEditChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  onEditSubmit(message.id)
                }
                if (event.key === 'Escape') {
                  onEditCancel()
                }
              }}
              className="flex-1 rounded-xl border px-3 py-2 text-sm focus:outline-none"
              style={{
                backgroundColor: theme.inputBg,
                borderColor: theme.dividerColor,
                color: theme.textColor,
              }}
              autoFocus
            />
            <button
              type="button"
              onClick={() => onEditSubmit(message.id)}
              className="rounded-xl px-3 py-2 text-sm"
              style={{
                backgroundColor: theme.primaryColor,
                color: theme.onPrimaryColor,
              }}
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onEditCancel}
              className="rounded-xl px-3 py-2 text-sm"
              style={{
                backgroundColor: theme.hoverBg,
                color: theme.subtextColor,
              }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="group relative">
            {attachment && (
              <div
                className="mb-2 overflow-hidden rounded-xl border"
                style={{
                  borderColor: theme.borderColor,
                  backgroundColor: theme.cardBg,
                }}
              >
                {isImage ? (
                  <div className="group relative">
                    <img
                      src={attachment.url}
                      alt={attachment.name}
                      className="h-auto max-w-md w-full cursor-pointer object-cover transition-opacity hover:opacity-90"
                      style={{ maxHeight: '400px' }}
                      onClick={() => onImageClick(attachment.url, attachment.name)}
                    />
                    <div className="absolute right-2 top-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          onImageClick(attachment.url, attachment.name)
                        }}
                        className="rounded-full border p-2 backdrop-blur-sm transition-colors"
                        style={{
                          backgroundColor: theme.overlayBg,
                          borderColor: theme.dividerColor,
                          color: theme.textColor,
                        }}
                        title="Ver imagen completa"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          onDownload(attachment.url, attachment.name)
                        }}
                        className="rounded-full border p-2 backdrop-blur-sm transition-colors"
                        style={{
                          backgroundColor: theme.overlayBg,
                          borderColor: theme.dividerColor,
                          color: theme.textColor,
                        }}
                        title="Descargar imagen"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 transition-opacity hover:opacity-80"
                    style={{ backgroundColor: theme.inputBg }}
                  >
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: theme.hoverBg }}
                    >
                      {(() => {
                        const IconComponent = getFileIcon(attachment.mimeType)
                        return (
                          <IconComponent
                            className="h-5 w-5"
                            style={{ color: theme.primaryColor }}
                          />
                        )
                      })()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-sm font-medium"
                        style={{ color: theme.textColor }}
                      >
                        {attachment.name}
                      </p>
                      <p className="text-xs" style={{ color: theme.subtextColor }}>
                        {formatFileSize(attachment.size)}
                      </p>
                    </div>
                    <Paperclip
                      className="h-4 w-4 flex-shrink-0"
                      style={{ color: theme.subtextColor }}
                    />
                  </a>
                )}
              </div>
            )}

            {textContent && (
              <div
                className="rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                style={{
                  backgroundColor: isOwnMessage ? theme.primaryColor : theme.cardBg,
                  color: isOwnMessage ? theme.onPrimaryColor : theme.textColor,
                  borderRadius: isOwnMessage ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  border: !isOwnMessage ? `1px solid ${theme.borderColor}` : 'none',
                  boxShadow: isOwnMessage
                    ? theme.isDark
                      ? '0 8px 20px rgba(0, 212, 179, 0.18)'
                      : '0 8px 20px rgba(15, 23, 42, 0.12)'
                    : theme.isDark
                      ? '0 8px 20px rgba(0, 0, 0, 0.2)'
                      : '0 8px 20px rgba(15, 23, 42, 0.06)',
                }}
              >
                <p className="break-words whitespace-pre-wrap">{textContent}</p>
              </div>
            )}

            <div
              className={`mt-1 flex items-center gap-1.5 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <span className="text-[10px]" style={{ color: theme.mutedTextColor }}>
                {formatTime(message.created_at)}
              </span>
              {message.is_edited && (
                <span
                  className="text-[10px] italic"
                  style={{ color: theme.mutedTextColor }}
                >
                  (editado)
                </span>
              )}
            </div>

            {isOwnMessage && (
              <div className="absolute -left-16 top-1/2 flex -translate-y-1/2 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => onStartEdit(message)}
                  className="rounded-full p-1.5 transition-colors"
                  style={{ backgroundColor: theme.hoverBg }}
                  title="Editar"
                >
                  <Edit2 className="h-3 w-3" style={{ color: theme.subtextColor }} />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(message.id)}
                  className="rounded-full p-1.5 transition-colors"
                  style={{ backgroundColor: theme.hoverBg }}
                  title="Eliminar"
                >
                  <Trash2 className="h-3 w-3" style={{ color: theme.dangerColor }} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
