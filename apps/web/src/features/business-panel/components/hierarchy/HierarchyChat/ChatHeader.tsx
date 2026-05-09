import { Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useBusinessPanelTheme } from '../../../hooks/useBusinessPanelTheme'

interface ChatHeaderProps {
  title: string
  description?: string
  participantsCount: number
  onlineCount: number
}

export function ChatHeader({
  title,
  description,
  participantsCount,
  onlineCount,
}: ChatHeaderProps) {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()

  const participantsLabel =
    participantsCount === 1
      ? t('hierarchy.chat.participants_one')
      : t('hierarchy.chat.participants_other', { count: participantsCount })

  return (
    <div
      className="border-b px-5 py-4"
      style={{
        backgroundColor: theme.panelBg,
        borderColor: theme.dividerColor,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2
            className="truncate text-base font-semibold"
            style={{ color: theme.textColor }}
          >
            {title}
          </h2>
          {description && (
            <p
              className="mt-1 line-clamp-2 text-sm"
              style={{ color: theme.subtextColor }}
            >
              {description}
            </p>
          )}
        </div>

        <div
          className="inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium"
          style={{
            backgroundColor: theme.hoverBg,
            color: theme.subtextColor,
            border: `1px solid ${theme.borderColor}`,
          }}
        >
          <Users className="h-3.5 w-3.5" />
          <span>{participantsLabel}</span>
          {onlineCount > 0 && (
            <>
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: theme.successColor }}
              />
              <span>{onlineCount} {t('hierarchy.chat.online')}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
