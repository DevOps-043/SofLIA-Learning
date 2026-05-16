'use client'

import { useTranslation } from 'react-i18next'
import type { AdminCompanyMember } from '../../types/admin-companies.types'
import type { AdminCompaniesThemeColors } from '../../services/admin-companies'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import { AdminCompanyMemberRow } from './AdminCompanyMemberRow'

interface AdminCompanyAdminsSectionProps {
  members: AdminCompanyMember[]
  themeColors: AdminCompaniesThemeColors
}

export function AdminCompanyAdminsSection(props: AdminCompanyAdminsSectionProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()
  return (
    <section className="rounded-[22px] border p-4" style={{ backgroundColor: props.themeColors.inputBg, borderColor: props.themeColors.borderColor }}>
      <h3 className="mb-4 text-xs font-extrabold uppercase tracking-widest" style={{ color: theme.primaryColor }}>{t('companies.modal.admins')}</h3>
      <div className="space-y-3">
        {props.members.length > 0 ? props.members.map((member) => <AdminCompanyMemberRow key={member.id} member={member} roleLabel={member.role === 'owner' ? t('companies.modal.roles.owner') : t('companies.modal.roles.admin')} fallback={t('companies.modal.unknownUser')} themeColors={props.themeColors} />) : <p className="rounded-2xl px-4 py-3 text-center text-sm font-medium" style={{ color: props.themeColors.textSecondary }}>{t('companies.modal.noAdmins')}</p>}
      </div>
    </section>
  )
}
