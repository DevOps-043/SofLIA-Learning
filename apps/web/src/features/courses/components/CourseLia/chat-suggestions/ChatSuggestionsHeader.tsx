import { motion } from 'framer-motion'
import { ChevronDown, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import styles from '../CourseLiaPanel.module.css'

interface ChatSuggestionsHeaderProps {
  isExpanded: boolean
  isLoading: boolean
  onToggleExpanded: () => void
}

export function ChatSuggestionsHeader({
  isExpanded,
  isLoading,
  onToggleExpanded,
}: ChatSuggestionsHeaderProps) {
  const { t } = useTranslation('common')

  return (
    <div className={styles.suggestionsHeader}>
      <div className={styles.suggestionsLabel}>
        <Sparkles aria-hidden="true" size={13} className={styles.suggestionsIcon} />
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
          className={styles.suggestionsToggle}
        >
          {isExpanded ? t('actions.hide') : t('actions.show')}
          <motion.span animate={{ rotate: isExpanded ? 0 : 180 }} transition={{ duration: 0.2 }} style={{ display: 'inline-flex' }}>
            <ChevronDown aria-hidden="true" size={12} />
          </motion.span>
        </button>
      ) : null}
    </div>
  )
}
