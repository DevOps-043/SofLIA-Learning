import { ArrowRight, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { SystemErrorScene } from '../../../../_components/system-error/SystemErrorScene'
import errorStyles from '../../../../_components/system-error/SystemErrorScene.module.css'
import type { BusinessUserDashboardColors } from '../types'

interface BusinessUserDashboardErrorProps {
  orgColors: BusinessUserDashboardColors
  error: string
  onRetry: () => void
}

export function BusinessUserDashboardError({
  orgColors,
  error,
  onRetry,
}: BusinessUserDashboardErrorProps) {
  const errorTheme = {
    '--error-accent': orgColors.accent,
    '--error-status': orgColors.accent,
    '--error-page-bg': orgColors.sidebarBg,
    '--error-page-glow': `color-mix(in srgb, ${orgColors.accent} 12%, transparent)`,
    '--error-page-secondary-glow': `color-mix(in srgb, ${orgColors.primary} 16%, transparent)`,
    '--error-surface': orgColors.cardBg,
    '--error-border': orgColors.border,
    '--error-divider': orgColors.border,
    '--error-text': orgColors.text,
    '--error-muted': orgColors.textSecondary,
    '--error-faint': orgColors.textMuted,
    '--error-action': orgColors.primary,
    '--error-on-action': orgColors.onPrimary,
  } as CSSProperties

  return (
    <SystemErrorScene
      code="500"
      eyebrow="Interrupción temporal"
      title="No pudimos cargar tu espacio."
      description="Tu información permanece segura. Intenta cargar nuevamente o vuelve al inicio mientras restablecemos esta vista."
      detail={error}
      style={errorTheme}
      actions={
        <>
          <button type="button" onClick={onRetry} className={errorStyles.primaryButton}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Intentar de nuevo
          </button>
          <Link href="/" className={errorStyles.secondaryButton}>
            Ir al inicio
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </>
      }
    />
  )
}
