import { X } from 'lucide-react'
import type { BusinessUserDashboardColors } from '../../types'
import { getHoverCardPosition } from './hover-card-position'
import { PreviewBadge } from './PreviewBadge'
import { PreviewPoints } from './PreviewPoints'
import { PreviewProgress } from './PreviewProgress'
import type { InfoHoverCardState, LearningPathTranslator } from './types'

interface InfoHoverCardProps {
  card: InfoHoverCardState
  orgColors: BusinessUserDashboardColors
  onMouseEnter: () => void
  onMouseLeave: () => void
  onClose: () => void
  t: LearningPathTranslator
}

export function InfoHoverCard({
  card,
  orgColors,
  onMouseEnter,
  onMouseLeave,
  onClose,
  t,
}: InfoHoverCardProps) {
  const position = getHoverCardPosition(card.rect)
  const badgeLabel = card.loading
    ? t('dashboard.learningPaths.previewLoadingBadge', 'Analizando')
    : card.source === 'gemini'
      ? t('dashboard.learningPaths.geminiPreviewBadge', 'Analisis Gemini')
      : t('dashboard.learningPaths.previewBadge', 'Resumen')

  return (
    <div
      className="fixed z-[80] rounded-lg border p-5 shadow-2xl"
      style={{
        left: position.left,
        top: position.top,
        width: position.width,
        maxHeight: position.maxHeight,
        overflowY: 'auto',
        backgroundColor: orgColors.cardBg,
        borderColor: orgColors.border,
        color: orgColors.text,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="tooltip"
      aria-label={card.title}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full md:hidden"
        style={{ backgroundColor: `color-mix(in srgb, ${orgColors.textMuted} 12.5%, transparent)`, color: orgColors.text }}
        aria-label={t('actions.close', 'Cerrar')}
      >
        <X className="h-4 w-4" />
      </button>

      {position.arrowSide !== 'none' ? (
        <span
          className={`absolute top-12 h-4 w-4 rotate-45 border ${
            position.arrowSide === 'left' ? '-left-2 border-r-0 border-t-0' : '-right-2 border-b-0 border-l-0'
          }`}
          style={{ backgroundColor: orgColors.cardBg, borderColor: orgColors.border }}
        />
      ) : null}

      <PreviewBadge label={badgeLabel} loading={card.loading} orgColors={orgColors} />
      <h3 className="text-lg font-bold leading-snug" style={{ color: orgColors.text }}>
        {card.title}
      </h3>
      <p className="mt-1 text-xs font-semibold" style={{ color: orgColors.textSecondary }}>
        {card.meta}
      </p>
      <PreviewProgress progress={card.progress} orgColors={orgColors} />
      {card.status ? (
        <p className="mt-2 text-xs font-semibold" style={{ color: orgColors.textSecondary }}>
          {card.status}
        </p>
      ) : null}
      <p className="mt-4 text-sm leading-relaxed" style={{ color: orgColors.textSecondary }}>
        {card.description}
      </p>
      <PreviewPoints loading={card.loading} points={card.points} orgColors={orgColors} />
    </div>
  )
}
