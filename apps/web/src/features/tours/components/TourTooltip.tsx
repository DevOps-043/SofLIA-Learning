'use client'

import { useId } from 'react'
import {
  Award,
  BellRing,
  BookOpenCheck,
  Bot,
  ChartSpline,
  Check,
  ChevronLeft,
  ChevronRight,
  CirclePlay,
  CircleUserRound,
  ClipboardCheck,
  Compass,
  LayoutDashboard,
  ListTree,
  MessagesSquare,
  Network,
  NotebookPen,
  PanelsTopLeft,
  Search,
  Settings2,
  SlidersHorizontal,
  UsersRound,
  X,
  type LucideIcon,
} from 'lucide-react'
import type { TooltipRenderProps } from 'react-joyride'
import { useTranslation } from 'react-i18next'

import { translateTourKey } from '../utils/tour.i18n'
import { TourProgress } from './TourProgress'
import styles from './TourTooltip.module.css'

function resolveStepIcon(target: unknown): LucideIcon {
  const targetName = typeof target === 'string' ? target.toLowerCase() : ''

  if (targetName.includes('notes')) return NotebookPen
  if (targetName.includes('structure-selector')) return ListTree
  if (/(hierarchy|tree-body|structure)/.test(targetName)) return Network
  if (/(notifications|alert)/.test(targetName)) return BellRing
  if (/(certificate|badge)/.test(targetName)) return Award
  if (/(video|player)/.test(targetName)) return CirclePlay
  if (/(question|community|chat)/.test(targetName)) return MessagesSquare
  if (/(activit|quiz|practice|review)/.test(targetName)) return ClipboardCheck
  if (/(soflia|assistant)/.test(targetName)) return Bot
  if (/(settings|branding|configuration)/.test(targetName)) return Settings2
  if (/(account|profile)/.test(targetName)) return CircleUserRound
  if (/(users|workforce|team)/.test(targetName)) return UsersRound
  if (/(stats|report|progress|kpi|radar|compliance|funnel|scatter|ranking|segments|trend|academic|insights|quality)/.test(targetName)) return ChartSpline
  if (targetName.includes('search')) return Search
  if (/(filter|selector|toggle)/.test(targetName)) return SlidersHorizontal
  if (/(sidebar|top-nav|tabs|menu)/.test(targetName)) return PanelsTopLeft
  if (/(course|lesson|module|content|resource|learning-path|workshop)/.test(targetName)) return BookOpenCheck
  if (/(hero|workspace|header|page)/.test(targetName)) return LayoutDashboard

  return Compass
}

export function TourTooltip({
  backProps,
  index,
  isLastStep,
  primaryProps,
  size,
  skipProps,
  step,
  tooltipProps,
}: TooltipRenderProps) {
  const { t, i18n } = useTranslation('tours')
  const titleId = useId()
  const descriptionId = useId()
  const skipLabel = translateTourKey(t, i18n, 'actions.skip')
  const backLabel = translateTourKey(t, i18n, 'actions.back')
  const primaryLabel = translateTourKey(t, i18n, isLastStep ? 'actions.finish' : 'actions.next')
  const guideLabel = translateTourKey(t, i18n, 'guideLabel')
  const originalTarget = (step.data as { tourTarget?: unknown } | undefined)?.tourTarget
  const StepIcon = resolveStepIcon(originalTarget ?? step.target)

  return (
    <section
      {...tooltipProps}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className={`${styles.tooltip} joyride-tooltip-container`}
    >
      <span className={styles.topAccent} aria-hidden="true" />
      <span className={styles.atmosphere} aria-hidden="true" />

      <button
        type="button"
        {...skipProps}
        aria-label={skipLabel}
        title={skipLabel}
        className={styles.closeButton}
      >
        <X aria-hidden="true" />
      </button>

      <header className={styles.header}>
        <span className={styles.iconShell} aria-hidden="true">
          <StepIcon />
          <span className={styles.iconDetail} />
        </span>
        <div className={styles.headingCopy}>
          <p className={styles.eyebrow}>{guideLabel}</p>
          <h2 id={titleId} className={styles.title}>{step.title}</h2>
        </div>
      </header>

      <div id={descriptionId} className={styles.content}>
        {step.content}
      </div>

      <footer className={styles.footer}>
        <TourProgress current={index} total={size} />

        <div className={styles.actions}>
          {index > 0 ? (
            <button
              type="button"
              {...backProps}
              aria-label={backLabel}
              title={backLabel}
              className={styles.backButton}
            >
              <ChevronLeft aria-hidden="true" />
            </button>
          ) : null}

          <button
            type="button"
            {...primaryProps}
            className={styles.primaryButton}
          >
            <span>{primaryLabel}</span>
            {isLastStep ? <Check aria-hidden="true" /> : <ChevronRight aria-hidden="true" />}
          </button>
        </div>
      </footer>
    </section>
  )
}
