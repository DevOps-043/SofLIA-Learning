import { useMemo } from 'react'
import type { TFunction } from 'i18next'

export function useLearnPageTabs(t: TFunction<'learn'>) {
  return useMemo(
    () => [
      { id: 'video' as const, label: t('tabs.video'), icon: 'Play' },
      {
        id: 'activities' as const,
        label: t('tabs.activities'),
        icon: 'Activity',
      },
      {
        id: 'questions' as const,
        label: t('tabs.questions'),
        icon: 'MessageCircle',
      },
    ],
    [t],
  )
}
