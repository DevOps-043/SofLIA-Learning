import { Send, Loader2, Smile, Paperclip } from 'lucide-react'
import { EmojiPicker } from './EmojiPicker'
import type { EmojiCategory } from './types'

interface ChatInputProps {
  messageContent: string
  onMessageChange: (value: string) => void
  onSend: () => void
  isSending: boolean
  hasFile: boolean
  showEmojiPicker: boolean
  onToggleEmojiPicker: () => void
  activeEmojiCategory: EmojiCategory
  onEmojiCategoryChange: (category: EmojiCategory) => void
  onEmojiSelect: (emoji: string) => void
  onFileClick: () => void
  fileInputRef: React.RefObject<HTMLInputElement>
  emojiPickerRef: React.RefObject<HTMLDivElement>
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  primaryColor: string
  isDark: boolean
}

export function ChatInput({
  messageContent,
  onMessageChange,
  onSend,
  isSending,
  hasFile,
  showEmojiPicker,
  onToggleEmojiPicker,
  activeEmojiCategory,
  onEmojiCategoryChange,
  onEmojiSelect,
  onFileClick,
  fileInputRef,
  emojiPickerRef,
  onFileChange,
  primaryColor,
  isDark
}: ChatInputProps) {
  const canSend = (messageContent?.trim() || hasFile) && !isSending

  return (
    <div
      className="p-4 border-t"
      style={{
        backgroundColor: isDark ? '#1E2329' : '#FFFFFF',
        borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
      }}
    >
      <div className="flex items-center gap-3">
        {/* Botón de archivos */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileChange}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        />
        <button
          onClick={onFileClick}
          className="p-2 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
          style={{
            color: isDark ? '#FFFFFF' : '#64748B'
          }}
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={messageContent}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                onSend()
              }
            }}
            placeholder="Escribe un mensaje..."
            className="w-full px-4 py-3 pr-12 rounded-2xl text-sm focus:outline-none transition-colors border"
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6',
              color: isDark ? '#FFFFFF' : '#1E293B',
              borderColor: 'transparent'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = primaryColor}
            onBlur={(e) => e.currentTarget.style.borderColor = 'transparent'}
            disabled={isSending}
          />

          {/* Botón de emojis */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center" ref={emojiPickerRef}>
            <button
              onClick={onToggleEmojiPicker}
              className="flex items-center justify-center transition-colors"
              style={{ color: isDark ? '#FFFFFF' : '#64748B' }}
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <EmojiPicker
                activeCategory={activeEmojiCategory}
                onCategoryChange={onEmojiCategoryChange}
                onEmojiSelect={onEmojiSelect}
                primaryColor={primaryColor}
                isDark={isDark}
              />
            )}
          </div>
        </div>

        {/* Botón de enviar */}
        <button
          onClick={onSend}
          disabled={!canSend}
          className="p-3 rounded-2xl transition-all duration-200 flex items-center justify-center"
          style={{
            backgroundColor: canSend ? primaryColor : (isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB'),
            color: '#FFFFFF',
            cursor: !canSend ? 'not-allowed' : 'pointer',
            boxShadow: canSend ? `0 4px 14px ${primaryColor}40` : 'none'
          }}
          onMouseEnter={(e) => {
            if (canSend) {
              e.currentTarget.style.transform = 'scale(1.05)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          {isSending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  )
}
