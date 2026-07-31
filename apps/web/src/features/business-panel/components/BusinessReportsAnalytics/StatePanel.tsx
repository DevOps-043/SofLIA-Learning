import type { LucideIcon } from 'lucide-react'
import type { ThemeTokens } from './types'
import styles from './ReportsAnalytics.module.css'

export function StatePanel({
  theme,
  icon: Icon,
  title,
  message,
  spinning = false,
}: {
  theme: ThemeTokens
  icon: LucideIcon
  title: string
  message: string
  spinning?: boolean
}) {
  return (
    <section
      className={styles.statePanel}
      style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
      aria-live="polite"
    >
      <div className={styles.statePanelContent}>
        <div
          className={styles.statePanelIcon}
          style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}
          aria-hidden="true"
        >
          <Icon className={spinning ? 'h-5 w-5 animate-spin' : 'h-5 w-5'} />
        </div>
        <div>
          <h2 className={styles.statePanelTitle} style={{ color: theme.textColor }}>{title}</h2>
          <p className={styles.statePanelMessage} style={{ color: theme.subtextColor }}>{message}</p>
        </div>
      </div>
    </section>
  )
}
