'use client'

import { useState } from 'react'
import { Check, Copy, Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { AdminUser } from '../../../../services/adminUsers.service'
import { SECTION_TITLE_CLASS } from '../panel-ui'

interface AccountInfoSectionProps {
  user: AdminUser
}

function formatDate(value: string | null | undefined, locale: string): string {
  if (!value) return '—'
  return new Date(value).toLocaleString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Datos de solo lectura de la cuenta: ID, fechas clave y proveedor de acceso. */
export function AccountInfoSection({ user }: AccountInfoSectionProps) {
  const { t, i18n } = useTranslation('admin')
  const [copied, setCopied] = useState(false)

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(user.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard no disponible (contexto inseguro): no hay acción posible.
    }
  }

  const items: Array<{ label: string; value: string }> = [
    { label: t('users.masterPanel.account.info.createdAt'), value: formatDate(user.created_at, i18n.language) },
    { label: t('users.masterPanel.account.info.lastLogin'), value: formatDate(user.last_login_at, i18n.language) },
    { label: t('users.masterPanel.account.info.lastActivity'), value: formatDate(user.last_activity_at, i18n.language) },
    {
      label: t('users.masterPanel.account.info.provider'),
      value: user.oauth_provider || t('users.masterPanel.account.info.providerLocal'),
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.label}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {item.label}
            </p>
            <p className="mt-0.5 text-sm text-gray-900 dark:text-white">{item.value}</p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleCopyId}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 font-mono text-xs text-gray-500 transition-colors hover:bg-gray-100 dark:border-white/10 dark:text-gray-400 dark:hover:bg-white/5"
        title={t('users.masterPanel.account.info.copyId')}
      >
        {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
        {user.id}
      </button>
    </div>
  )
}
