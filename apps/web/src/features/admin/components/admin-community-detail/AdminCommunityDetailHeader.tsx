import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import type { AdminCommunity } from '../../services/adminCommunities.service'
import {
  getCommunityDetailCategoryConfig,
  getCommunityDetailStatusConfig,
} from './shared'

interface AdminCommunityDetailHeaderProps {
  community: AdminCommunity
  onBack: () => void
}

export function AdminCommunityDetailHeader({
  community,
  onBack,
}: AdminCommunityDetailHeaderProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()
  const categoryConfig = getCommunityDetailCategoryConfig(
    community.visibility,
    community.access_type,
    theme,
  )
  const statusConfig = getCommunityDetailStatusConfig(
    community.is_active,
    theme,
  )

  return (
    <div
      className="border-b"
      style={{
        background: theme.heroBackground,
        borderColor: theme.heroBorderColor,
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <button
              className="rounded-xl p-2 transition-colors"
              onClick={onBack}
              style={{
                backgroundColor: theme.inverseSurface,
                color: theme.inverseTextColor,
              }}
              type="button"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1
                className="truncate text-2xl font-bold"
                style={{ color: theme.inverseTextColor }}
              >
                {community.name}
              </h1>
              <p className="text-sm" style={{ color: theme.inverseSubtextColor }}>
                {t('communityDetail.page.subtitle')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[categoryConfig, statusConfig].map((config) => (
              <span
                className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold"
                key={config.labelKey}
                style={{
                  backgroundColor: config.bg,
                  borderColor: config.border,
                  color: config.color,
                }}
              >
                {config.labelKey ? t(config.labelKey) : null}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
