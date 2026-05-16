'use client'

import { Globe, Mail, Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import type { AdminCompany } from '../../types/admin-companies.types'
import type { AdminCompaniesThemeColors } from '../../services/admin-companies'
import { AdminCompanyInfoItem } from './AdminCompanyInfoItem'

interface AdminCompanyContactSectionProps {
  company: AdminCompany
  themeColors: AdminCompaniesThemeColors
}

export function AdminCompanyContactSection(props: AdminCompanyContactSectionProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()
  return (
    <section className="rounded-[22px] border p-4" style={{ backgroundColor: props.themeColors.inputBg, borderColor: props.themeColors.borderColor }}>
      <h3 className="mb-4 text-xs font-extrabold uppercase tracking-widest" style={{ color: theme.primaryColor }}>{t('companies.modal.contactInfo')}</h3>
      <div className="space-y-4">
        <AdminCompanyInfoItem icon={Mail} label={t('companies.modal.email')} value={props.company.contact_email || t('companies.modal.notDefined')} />
        <AdminCompanyInfoItem icon={Phone} label={t('companies.modal.phone')} value={props.company.contact_phone || t('companies.modal.notDefined')} />
        <AdminCompanyInfoItem icon={Globe} label={t('companies.modal.website')} value={props.company.website_url || t('companies.modal.notDefined')} />
      </div>
    </section>
  )
}
