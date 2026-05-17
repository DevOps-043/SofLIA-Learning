import { motion } from 'framer-motion'
import { ChevronDown, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { ChatSuggestionsVisualProps } from './types'

interface ChatSuggestionsHeaderProps extends ChatSuggestionsVisualProps {
  isExpanded: boolean
  isLoading: boolean
  onToggleExpanded: () => void
}

export function ChatSuggestionsHeader({
  isExpanded,
  isLoading,
  onToggleExpanded,
  theme,
}: ChatSuggestionsHeaderProps) {
  const { t } = useTranslation('common')

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', color: theme.textSecondary, fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Sparkles aria-hidden="true" style={{ width: '12px', height: '12px', color: theme.accentColor }} />
        <span>
          {isLoading
            ? t('lia.lessonSuggestions.loading')
            : t('lia.lessonSuggestions.title')}
        </span>
      </div>
      {!isLoading ? (
        <button
          type="button"
          onClick={onToggleExpanded}
          style={{ background: 'transparent', border: 'none', padding: '2px 4px', cursor: 'pointer', color: theme.accentColor, fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', borderRadius: '4px', transition: 'opacity 0.2s' }}
          onMouseEnter={(event) => {
            event.currentTarget.style.opacity = '0.8'
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.opacity = '1'
          }}
        >
          {isExpanded ? t('actions.hide') : t('actions.show')}
          <motion.span animate={{ rotate: isExpanded ? 0 : 180 }} transition={{ duration: 0.2 }} style={{ display: 'inline-flex' }}>
            <ChevronDown aria-hidden="true" style={{ width: '12px', height: '12px' }} />
          </motion.span>
        </button>
      ) : null}
    </div>
  )
}
