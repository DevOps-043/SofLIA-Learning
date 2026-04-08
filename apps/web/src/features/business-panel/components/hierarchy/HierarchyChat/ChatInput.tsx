import type { ChangeEvent, RefObject } from 'react'
import { Loader2, Paperclip, Send, Smile } from 'lucide-react'
import { useBusinessPanelTheme } from '../../../hooks/useBusinessPanelTheme'
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
  fileInputRef: RefObject<HTMLInputElement>
  emojiPickerRef: RefObject<HTMLDivElement>
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
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
}: ChatInputProps) {
  const theme = useBusinessPanelTheme()
  const canSend = Boolean(messageContent.trim() || hasFile) && !isSending

  return (
    <div
      className="border-t p-4"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.dividerColor,
      }}
    >
      <div className="flex items-center gap-3">
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileChange}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        />

        <button
          type="button"
          onClick={onFileClick}
          className="rounded-full p-2 transition-colors"
          style={{
            color: hasFile ? theme.primaryColor : theme.subtextColor,
            backgroundColor: hasFile ? theme.hoverBg : 'transparent',
          }}
        >
          <Paperclip className="h-5 w-5" />
        </button>

        <div className="relative flex-1">
          <input
            type="text"
            value={messageContent}
            onChange={(event) => onMessageChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                onSend()
              }
            }}
            placeholder="Escribe un mensaje..."
            className="w-full rounded-2xl border px-4 py-3 pr-12 text-sm transition-colors focus:outline-none"
            style={{
              backgroundColor: theme.inputBg,
              color: theme.textColor,
              borderColor: theme.dividerColor,
            }}
            onFocus={(event) => {
              event.currentTarget.style.borderColor = theme.primaryColor
            }}
            onBlur={(event) => {
              event.currentTarget.style.borderColor = theme.dividerColor
            }}
            disabled={isSending}
          />

          <div
            className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center"
            ref={emojiPickerRef}
          >
            <button
              type="button"
              onClick={onToggleEmojiPicker}
              className="flex items-center justify-center rounded-full p-1 transition-colors"
              style={{
                color: showEmojiPicker ? theme.primaryColor : theme.subtextColor,
                backgroundColor: showEmojiPicker ? theme.hoverBg : 'transparent',
              }}
            >
              <Smile className="h-5 w-5" />
            </button>

            {showEmojiPicker && (
              <EmojiPicker
                activeCategory={activeEmojiCategory}
                onCategoryChange={onEmojiCategoryChange}
                onEmojiSelect={onEmojiSelect}
              />
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          className="flex items-center justify-center rounded-2xl p-3 transition-all duration-200"
          style={{
            backgroundColor: canSend ? theme.primaryColor : theme.hoverBg,
            color: canSend ? theme.onPrimaryColor : theme.mutedTextColor,
            cursor: canSend ? 'pointer' : 'not-allowed',
            boxShadow: canSend
              ? theme.isDark
                ? '0 10px 24px rgba(0, 212, 179, 0.18)'
                : '0 10px 24px rgba(15, 23, 42, 0.12)'
              : 'none',
          }}
          onMouseEnter={(event) => {
            if (canSend) {
              event.currentTarget.style.transform = 'scale(1.05)'
            }
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.transform = 'scale(1)'
          }}
        >
          {isSending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>
  )
}
