'use client'

import { CalendarDays, Clock, Activity, Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { AdminUser } from '../../../../services/adminUsers.service'
import { SECTION_TITLE_CLASS } from '../panel-ui'

interface AccountInfoSectionProps {
  user: AdminUser
}

function formatDate(value: string | null | undefined, locale: string): string {
  if (!value) return '—'
  // Se etiqueta la zona horaria (timeZoneName) para no dar la impresión de que la
  // hora local es UTC: sin la etiqueta, cruzar contra la BD (UTC) inducía a pensar
  // que la actividad ocurrió después de la última conexión.
  return new Date(value).toLocaleString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

/** Datos de solo lectura de la cuenta: fechas clave y proveedor de acceso. */
export function AccountInfoSection({ user }: AccountInfoSectionProps) {
  const { t, i18n } = useTranslation('admin')

  const items: Array<{ label: string; value: string; icon: React.ReactNode }> = [
    {
      label: t('users.masterPanel.account.info.createdAt'),
      value: formatDate(user.created_at, i18n.language),
      icon: <CalendarDays className="h-4 w-4 text-accent" />,
    },
    {
      label: t('users.masterPanel.account.info.lastLogin'),
      value: formatDate(user.last_login_at, i18n.language),
      icon: <Clock className="h-4 w-4 text-blue-500" />,
    },
    {
      label: t('users.masterPanel.account.info.lastActivity'),
      value: formatDate(user.last_activity_at, i18n.language),
      icon: <Activity className="h-4 w-4 text-emerald-500" />,
    },
  ]

  return (
    <div className="rounded-xl border border-gray-200 p-4 dark:border-white/10">
      <p className={SECTION_TITLE_CLASS}>
        <Info className="mr-1.5 inline h-4 w-4" />
        {t('users.masterPanel.account.info.title')}
      </p>

      {user.is_banned ? (
        <p className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-500">
          {t('users.masterPanel.account.ban.bannedBadge', {
            date: formatDate(user.banned_at, i18n.language),
          })}
          {user.ban_reason ? ` · ${user.ban_reason}` : ''}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/70 px-3.5 py-3 dark:border-white/5 dark:bg-white/5"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-carbon-900">
              {item.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {item.label}
              </p>
              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

