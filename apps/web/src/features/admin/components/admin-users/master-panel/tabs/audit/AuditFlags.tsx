'use client'

import { AlertTriangle, Info, ShieldAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ForensicFlag } from '@/features/admin/services/user-forensics/user-forensics.types'

interface AuditFlagsProps {
  flags: ForensicFlag[]
}

const SEVERITY_STYLES: Record<ForensicFlag['severity'], { box: string; icon: React.ReactNode }> = {
  danger: {
    box: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
    icon: <ShieldAlert className="h-4 w-4" />,
  },
  warning: {
    box: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  info: {
    box: 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400',
    icon: <Info className="h-4 w-4" />,
  },
}

/** Señales de alerta forenses en lenguaje claro (posible trampa / anomalías). */
export function AuditFlags({ flags }: AuditFlagsProps) {
  const { t } = useTranslation('admin')
  if (flags.length === 0) return null

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {t('users.masterPanel.audit.flags.title')}
      </h4>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {flags.map((flag, index) => {
          const style = SEVERITY_STYLES[flag.severity]
          return (
            <div
              key={`${flag.key}-${index}`}
              className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${style.box}`}
            >
              <span className="mt-0.5 flex-shrink-0">{style.icon}</span>
              <span>{t(`users.masterPanel.audit.flags.${flag.key}`, flag.params ?? {})}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
