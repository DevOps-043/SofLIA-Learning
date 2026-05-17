'use client'

import { Loader2 } from 'lucide-react'
import type { BusinessPanelTheme, DeadlineT } from './types'

interface SuggestionsLoadingProps {
  theme: BusinessPanelTheme
  t: DeadlineT
}

export function SuggestionsLoading({ theme, t }: SuggestionsLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="mb-4 h-12 w-12 animate-spin" style={{ color: theme.primaryColor }} />
      <p style={{ color: theme.subtextColor }}>
        {t('liaSuggestion.steps.suggestions.calculating')}
      </p>
    </div>
  )
}
