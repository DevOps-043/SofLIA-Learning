import { motion } from 'framer-motion'
import Image from 'next/image'
import { Edit2, Trash2, Paperclip, File, Image as ImageIcon, Download, Maximize2 } from 'lucide-react'
import type { HierarchyChatMessage } from '../../../types/hierarchy.types'
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
  primaryColor: string
  accentColor: string
  isDark: boolean
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
  primaryColor,
  accentColor,
  isDark
}: ChatMessageProps) {
  const attachment = getAttachment(message)
  const isImage = attachment && attachment.mimeType.startsWith('image/')

  // Remover el texto placeholder de archivos adjuntos
  let textContent = message.content
  if (textContent === '📎 Archivo adjunto' || textContent.match(/^📎\s*.+$/)) {
    textContent = ''
  } else {
    textContent = textContent.replace(/📎\s*[^\n]+/g, '').trim()
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return ImageIcon
    return File
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
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
            >
              <span className="text-xs font-medium text-white">
                {getInitials(getSenderName(message))}
              </span>
            </div>
          )}
        </div>
      )}

      <div className={`flex flex-col gap-1 max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {!isOwnMessage && showAvatar && (
          <span
            className="text-xs font-medium ml-1"
            style={{ color: isDark ? '#FFFFFF' : '#1E293B' }}
          >
            {getSenderName(message)}
          </span>
        )}

        {isEditing ? (
          <div className="flex gap-2 w-full max-w-md">
            <input
              type="text"
              value={editContent}
              onChange={(e) => onEditChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  onEditSubmit(message.id)
                }
                if (e.key === 'Escape') {
                  onEditCancel()
                }
              }}
              className="flex-1 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 border"
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6',
                borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                color: isDark ? '#FFFFFF' : '#1E293B'
              }}
              autoFocus
            />
            <button
              onClick={() => onEditSubmit(message.id)}
              className="px-3 py-2 rounded-xl text-white text-sm"
              style={{ backgroundColor: primaryColor }}
            >
              ✓
            </button>
            <button
              onClick={onEditCancel}
              className="px-3 py-2 rounded-xl text-sm"
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
                color: isDark ? '#FFFFFF' : '#1E293B'
              }}
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="group relative">
            {/* Archivo adjunto */}
            {attachment && (
              <div
                className="mb-2 rounded-xl overflow-hidden border"
                style={{
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                }}
              >
                {isImage ? (
                  <div className="relative group">
                    <img
                      src={attachment.url}
                      alt={attachment.name}
                      className="w-full max-w-md h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      style={{ maxHeight: '400px' }}
                      onClick={() => onImageClick(attachment.url, attachment.name)}
                    />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onImageClick(attachment.url, attachment.name)
                        }}
                        className="p-2 rounded-full backdrop-blur-sm transition-colors bg-black/50 hover:bg-black/70"
                        title="Ver imagen completa"
                      >
                        <Maximize2 className="w-4 h-4 text-white" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDownload(attachment.url, attachment.name)
                        }}
                        className="p-2 rounded-full backdrop-blur-sm transition-colors bg-black/50 hover:bg-black/70"
                        title="Descargar imagen"
                      >
                        <Download className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 hover:opacity-80 transition-opacity"
                    style={{
                      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6'
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${primaryColor}20` }}
                    >
                      {(() => {
                        const IconComponent = getFileIcon(attachment.mimeType)
                        return <IconComponent className="w-5 h-5" style={{ color: primaryColor }} />
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: isDark ? '#FFFFFF' : '#1E293B' }}
                      >
                        {attachment.name}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#64748B' }}
                      >
                        {formatFileSize(attachment.size)}
                      </p>
                    </div>
                    <Paperclip
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#64748B' }}
                    />
                  </a>
                )}
              </div>
            )}

            {/* Contenido de texto */}
            {textContent && (
              <div
                className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                style={{
                  backgroundColor: isOwnMessage
                    ? (isDark ? primaryColor : accentColor)
                    : (isDark ? '#1E2329' : '#E5E7EB'),
                  color: isOwnMessage
                    ? '#FFFFFF'
                    : (isDark ? '#FFFFFF' : '#1E293B'),
                  borderRadius: isOwnMessage ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  border: !isOwnMessage ? `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'}` : 'none',
                  boxShadow: isOwnMessage
                    ? (isDark ? `0 2px 8px ${primaryColor}40` : `0 2px 8px ${accentColor}30`)
                    : (isDark ? '0 1px 2px rgba(0,0,0,0.05)' : '0 1px 3px rgba(0,0,0,0.08)')
                }}
              >
                <p className="whitespace-pre-wrap break-words">{textContent}</p>
              </div>
            )}

            <div className={`flex items-center gap-1.5 mt-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
              <span
                className="text-[10px]"
                style={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#64748B' }}
              >
                {formatTime(message.created_at)}
              </span>
              {message.is_edited && (
                <span
                  className="text-[10px] italic"
                  style={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#64748B' }}
                >
                  (editado)
                </span>
              )}
            </div>

            {isOwnMessage && (
              <div className="absolute -left-16 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <button
                  onClick={() => onStartEdit(message)}
                  className="p-1.5 rounded-full transition-colors"
                  style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6' }}
                  title="Editar"
                >
                  <Edit2 className="w-3 h-3" style={{ color: isDark ? '#FFFFFF' : '#64748B' }} />
                </button>
                <button
                  onClick={() => onDelete(message.id)}
                  className="p-1.5 rounded-full transition-colors hover:bg-red-100 dark:hover:bg-red-500/20"
                  style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6' }}
                  title="Eliminar"
                >
                  <Trash2 className="w-3 h-3 text-red-500" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
