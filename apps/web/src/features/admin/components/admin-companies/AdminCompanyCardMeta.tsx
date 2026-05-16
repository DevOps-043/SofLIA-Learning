'use client'

import { Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'

interface AdminCompanyCardMetaProps {
  normalizedPlan: string
  planColor: string
  subscriptionPlan: string | null
  contactEmail: string | null
}

export function AdminCompanyCardMeta(props: AdminCompanyCardMetaProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <span className="rounded-xl border px-3 py-1.5 text-xs font-extrabold" style={{ backgroundColor: `${props.planColor}14`, borderColor: `${props.planColor}26`, color: props.planColor }}>
        {t('companies.card.plan', { plan: t(`companies.plans.${props.normalizedPlan}`, { defaultValue: props.subscriptionPlan || t('companies.plans.none') }) })}
      </span>
      {props.contactEmail ? (
        <span className="flex min-w-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor, color: theme.subtextColor }} title={props.contactEmail}>
          <Mail className="h-3.5 w-3.5 shrink-0" />
          <span className="max-w-[150px] truncate">{props.contactEmail}</span>
        </span>
      ) : null}
    </div>
  )
}
