'use client'

import { FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'

export function ImportUsersFormatInfo() {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()
  const fields = [
    { field: 'username', desc: t('users.modals.import.format.username'), required: true },
    { field: 'email', desc: t('users.modals.import.format.email'), required: true },
    { field: 'password', desc: t('users.modals.import.format.password'), required: true },
    { field: 'job_title', desc: 'Cargo/Puesto', required: true },
    { field: 'org_role', desc: t('users.modals.import.format.role'), required: false },
    { field: 'date_of_birth', desc: t('users.modals.import.format.dateOfBirth'), required: false },
    { field: 'gender', desc: t('users.modals.import.format.gender'), required: false },
  ]

  return (
    <div className="rounded-xl p-4 border" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
      <p className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: theme.textColor }}>
        <FileText className="w-4 h-4" style={{ color: theme.accentColor }} />
        {t('users.modals.import.format.title')}
      </p>
      <div className="space-y-2">
        {fields.map(item => (
          <div key={item.field} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <code className="px-2 py-0.5 rounded text-xs font-mono border font-semibold" style={{ backgroundColor: `color-mix(in srgb, ${theme.primaryColor} 8.2%, transparent)`, color: theme.primaryColor, borderColor: `color-mix(in srgb, ${theme.primaryColor} 25.1%, transparent)` }}>{item.field}</code>
              <span style={{ color: theme.subtextColor }}>{item.desc}</span>
            </div>
            {item.required && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `color-mix(in srgb, ${theme.warningColor} 12.2%, transparent)`, color: theme.warningColor }}>{t('users.modals.import.format.required')}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
