import { useBusinessPanelTheme } from '../../../hooks/useBusinessPanelTheme'
import { EMOJI_CATEGORIES, type EmojiCategory } from './types'

interface EmojiPickerProps {
  activeCategory: EmojiCategory
  onCategoryChange: (category: EmojiCategory) => void
  onEmojiSelect: (emoji: string) => void
}

export function EmojiPicker({
  activeCategory,
  onCategoryChange,
  onEmojiSelect,
}: EmojiPickerProps) {
  const theme = useBusinessPanelTheme()

  return (
    <div
      className="absolute bottom-10 right-0 z-50 w-80 overflow-hidden rounded-xl border shadow-xl"
      style={{
        backgroundColor: theme.panelBg,
        borderColor: theme.dividerColor,
        boxShadow: theme.isDark
          ? '0 24px 60px rgba(0, 0, 0, 0.35)'
          : '0 24px 60px rgba(15, 23, 42, 0.14)',
      }}
    >
      <div
        className="flex items-center border-b px-2"
        style={{ borderColor: theme.dividerColor }}
      >
        {(Object.keys(EMOJI_CATEGORIES) as EmojiCategory[]).map((categoryKey) => {
          const category = EMOJI_CATEGORIES[categoryKey]
          const isActive = activeCategory === categoryKey

          return (
            <button
              key={categoryKey}
              type="button"
              onClick={() => onCategoryChange(categoryKey)}
              className="relative flex flex-1 items-center justify-center px-1 py-2 transition-colors"
              style={{
                color: isActive ? theme.primaryColor : theme.subtextColor,
                backgroundColor: isActive ? theme.hoverBg : 'transparent',
              }}
            >
              <span className="text-base">{category.icon}</span>
              {isActive && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: theme.primaryColor }}
                />
              )}
            </button>
          )
        })}
      </div>

      <div className="max-h-64 overflow-y-auto p-3">
        <div className="grid grid-cols-10 gap-1">
          {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onEmojiSelect(emoji)}
              className="flex h-7 w-7 items-center justify-center rounded text-base transition-colors"
              style={{ color: theme.textColor }}
              onMouseEnter={(event) => {
                event.currentTarget.style.backgroundColor = theme.hoverBg
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.backgroundColor = 'transparent'
              }}
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
