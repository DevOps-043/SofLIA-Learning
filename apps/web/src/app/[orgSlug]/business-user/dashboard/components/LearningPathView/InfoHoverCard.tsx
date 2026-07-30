import type { CSSProperties } from 'react'
import { X } from 'lucide-react'
import type { BusinessUserDashboardColors } from '../../types'
import { getHoverCardPosition } from './hover-card-position'
import { PreviewBadge } from './PreviewBadge'
import { PreviewPoints } from './PreviewPoints'
import { PreviewProgress } from './PreviewProgress'
import type { InfoHoverCardState, LearningPathTranslator } from './types'
import dashboardStyles from '../../page-components/BusinessUserDashboard.module.css'

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
      ? t('dashboard.learningPaths.geminiPreviewBadge', 'Análisis Gemini')
      : t('dashboard.learningPaths.previewBadge', 'Resumen')

  return (
    <div
      className={dashboardStyles.previewCard}
      style={{
        left: position.left,
        top: position.top,
        width: position.width,
        maxHeight: position.maxHeight,
        '--dashboard-primary': orgColors.primary,
        '--dashboard-accent': orgColors.accent,
        '--dashboard-text': orgColors.text,
        '--dashboard-muted': orgColors.textSecondary,
        '--dashboard-surface': orgColors.cardBg,
        '--dashboard-border': orgColors.border,
      } as CSSProperties}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="dialog"
      aria-label={card.title}
    >
      <span className={dashboardStyles.previewGlow} aria-hidden="true" />
      <button
        type="button"
        onClick={onClose}
        className={dashboardStyles.previewClose}
        aria-label={t('actions.close', 'Cerrar')}
      >
        <X className="h-4 w-4" />
      </button>

      <div className={dashboardStyles.previewHeader}>
        <PreviewBadge label={badgeLabel} loading={card.loading} orgColors={orgColors} />
      </div>
      <h3 className={dashboardStyles.previewTitle}>
        {card.title}
      </h3>
      <p className={dashboardStyles.previewMeta}>
        {card.meta}
      </p>
      <PreviewProgress progress={card.progress} orgColors={orgColors} />
      {card.status ? (
        <p className={dashboardStyles.previewStatus}>
          {card.status}
        </p>
      ) : null}
      <p className={dashboardStyles.previewDescription}>
        {card.description}
      </p>
      <PreviewPoints loading={card.loading} points={card.points} orgColors={orgColors} />
    </div>
  )
}
