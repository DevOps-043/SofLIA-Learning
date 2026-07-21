'use client'

import { useTranslation } from 'react-i18next'
import {
  formatForensicTimestamp,
  type ForensicTimeZone,
} from '@/shared/utils/forensic-timestamp'
import type { ForensicSession } from '@/features/admin/services/user-forensics/user-forensics.types'

interface AuditSessionsTableProps {
  sessions: ForensicSession[]
  /** IPs detectadas en TODAS las fuentes (incluso sin sesiones de login). */
  ipAddresses: string[]
  zone: ForensicTimeZone
}

function DetectedIps({ ipAddresses }: { ipAddresses: string[] }) {
  const { t } = useTranslation('admin')
  if (ipAddresses.length === 0) return null
  return (
    <div className="mb-2 flex flex-wrap items-center gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {t('users.masterPanel.audit.sessions.detectedIps')}
      </span>
      {ipAddresses.map((ip) => (
        <span
          key={ip}
          className="rounded-full bg-gray-100 px-2 py-0.5 font-mono text-[11px] text-gray-600 dark:bg-white/10 dark:text-gray-300"
        >
          {ip}
        </span>
      ))}
    </div>
  )
}

export function AuditSessionsTable({ sessions, ipAddresses, zone }: AuditSessionsTableProps) {
  const { t } = useTranslation('admin')

  if (sessions.length === 0) {
    return (
      <div>
        <DetectedIps ipAddresses={ipAddresses} />
        <p className="rounded-lg border border-gray-200 bg-gray-50/70 px-3 py-4 text-center text-xs text-gray-400 dark:border-white/10 dark:bg-white/5">
          {ipAddresses.length > 0
            ? t('users.masterPanel.audit.sessions.noLoginRows')
            : t('users.masterPanel.audit.sessions.empty')}
        </p>
      </div>
    )
  }

  return (
    <div>
      <DetectedIps ipAddresses={ipAddresses} />
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10">
      <table className="min-w-full text-left text-xs">
        <thead className="bg-gray-50 text-gray-500 dark:bg-white/5 dark:text-gray-400">
          <tr>
            <th className="px-3 py-2 font-semibold">{t('users.masterPanel.audit.sessions.ip')}</th>
            <th className="px-3 py-2 font-semibold">{t('users.masterPanel.audit.sessions.device')}</th>
            <th className="px-3 py-2 font-semibold">{t('users.masterPanel.audit.sessions.createdAt')}</th>
            <th className="px-3 py-2 font-semibold">{t('users.masterPanel.audit.sessions.lastUsedAt')}</th>
            <th className="px-3 py-2 font-semibold">{t('users.masterPanel.audit.sessions.status')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
          {sessions.map((session) => (
            <tr key={session.id} className="text-gray-700 dark:text-gray-200">
              <td className="px-3 py-2 font-mono">{session.ipAddress ?? '—'}</td>
              <td className="max-w-[280px] px-3 py-2">
                <span className="block truncate" title={session.userAgent ?? undefined}>
                  {session.userAgent ?? '—'}
                </span>
                {session.deviceFingerprint ? (
                  <span className="block truncate font-mono text-[10px] text-gray-400">
                    {session.deviceFingerprint}
                  </span>
                ) : null}
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                {formatForensicTimestamp(session.createdAtUtc, zone)}
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                {formatForensicTimestamp(session.lastUsedAtUtc, zone)}
              </td>
              <td className="px-3 py-2">
                {session.isRevoked ? (
                  <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-500">
                    {t('users.masterPanel.audit.sessions.revoked')}
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                    {t('users.masterPanel.audit.sessions.active')}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  )
}
