'use client'

import { Plus, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { AdminButton, AdminSectionHeader } from '../ui'

interface AdminCommunitiesHeaderProps {
  onCreate: () => void
}

export function AdminCommunitiesHeader({ onCreate }: AdminCommunitiesHeaderProps) {
  const { t } = useTranslation('admin')

  return (
    <AdminSectionHeader
      size="page"
      icon={Users}
      kicker={t('communities.page.kicker')}
      title={t('communities.page.title')}
      description={t('communities.page.description')}
      actions={(
        <AdminButton icon={Plus} onClick={onCreate}>
          {t('communities.page.create')}
        </AdminButton>
      )}
    />
  )
}
