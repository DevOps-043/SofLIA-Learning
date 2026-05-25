import { Loader2, Play } from 'lucide-react'
import type { BusinessUserDashboardColors } from '../../types'
import type { IntroVideoState, LearningPathTranslator } from './types'

interface IntroVideoButtonProps {
  intro: IntroVideoState
  orgColors: BusinessUserDashboardColors
  onClick: () => void
  targetId?: string
  t: LearningPathTranslator
}

export function IntroVideoButton({
  intro,
  orgColors,
  onClick,
  targetId,
  t,
}: IntroVideoButtonProps) {
  return (
    <button
      type="button"
      id={targetId}
      disabled={intro.loading}
      onClick={onClick}
      className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md border px-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-55"
      style={{
        backgroundColor: intro.loading ? `color-mix(in srgb, ${orgColors.textMuted} 7.1%, transparent)` : orgColors.cardBg,
        borderColor: intro.loading ? orgColors.border : orgColors.iconColor,
        color: intro.loading ? orgColors.textMuted : orgColors.text,
      }}
      aria-label={t('dashboard.learningPaths.viewTour', 'Video introductorio')}
    >
      {intro.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
      {intro.loading
        ? t('dashboard.learningPaths.tourLoading', 'Cargando video')
        : t('dashboard.learningPaths.viewTour', 'Video introductorio')}
    </button>
  )
}
