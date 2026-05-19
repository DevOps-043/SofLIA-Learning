'use client'

import { useTranslation } from 'react-i18next'
import { Loader2, Search, X } from 'lucide-react'
import { useBusinessPanelTheme } from '../../../hooks/useBusinessPanelTheme'
import type { NodeManagerUser } from './node-form.utils'

interface ManagerSelectorProps {
  selectedManager: NodeManagerUser | null
  managerSearch: string
  managerResults: NodeManagerUser[]
  isSearchingManager: boolean
  onSearchChange: (v: string) => void
  onSelectManager: (user: NodeManagerUser) => void
  onClearManager: () => void
}

export function ManagerSelector({
  selectedManager,
  managerSearch,
  managerResults,
  isSearchingManager,
  onSearchChange,
  onSelectManager,
  onClearManager,
}: ManagerSelectorProps) {
  const theme = useBusinessPanelTheme()
  const { t } = useTranslation('business')

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium" style={{ color: theme.textColor }}>
        {t('hierarchy.nodeForm.fields.manager')}
      </label>

      {selectedManager ? (
        <div
          className="flex items-center justify-between rounded-xl border p-3"
          style={{
            backgroundColor: theme.actionSurface,
            borderColor: `color-mix(in srgb, ${theme.actionColor} 13.3%, transparent)`,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full"
              style={{ backgroundColor: `color-mix(in srgb, ${theme.actionColor} 12.5%, transparent)` }}
            >
              {selectedManager.profile_picture_url ? (
                <img src={selectedManager.profile_picture_url} className="h-full w-full object-cover" alt="" />
              ) : (
                <span className="text-xs font-bold" style={{ color: theme.actionColor }}>
                  {(selectedManager.first_name?.[0] || selectedManager.username?.[0] || '?').toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: theme.textColor }}>
                {selectedManager.first_name} {selectedManager.last_name}
              </p>
              <p className="text-xs" style={{ color: theme.subtextColor }}>
                {selectedManager.email}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClearManager}
            className="rounded-full p-1 transition-colors"
            style={{ color: theme.actionColor }}
            onMouseEnter={event => {
              event.currentTarget.style.backgroundColor = `color-mix(in srgb, ${theme.actionColor} 7.8%, transparent)`
            }}
            onMouseLeave={event => {
              event.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: theme.mutedTextColor }} />
            <input
              type="text"
              value={managerSearch}
              onChange={event => onSearchChange(event.target.value)}
              placeholder={t('hierarchy.nodeForm.placeholders.searchUser')}
              className="w-full rounded-xl border py-3 pl-9 pr-4 text-sm outline-none transition-all"
              style={{
                backgroundColor: theme.inputBg,
                borderColor: theme.borderColor,
                color: theme.textColor,
              }}
            />
            {isSearchingManager ? (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin" style={{ color: theme.mutedTextColor }} />
              </div>
            ) : null}
          </div>

          {managerResults.length > 0 && managerSearch ? (
            <div
              className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border shadow-lg"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.borderColor,
              }}
            >
              {managerResults.map(user => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => onSelectManager(user)}
                  className="flex w-full items-center gap-3 p-3 text-left transition-colors"
                  onMouseEnter={event => {
                    event.currentTarget.style.backgroundColor = theme.hoverBg
                  }}
                  onMouseLeave={event => {
                    event.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <div
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center overflow-hidden rounded-full"
                    style={{ backgroundColor: theme.hoverBg }}
                  >
                    {user.profile_picture_url ? (
                      <img src={user.profile_picture_url} className="h-full w-full object-cover" alt="" />
                    ) : (
                      <span className="text-[10px] font-bold" style={{ color: theme.subtextColor }}>
                        {(user.first_name?.[0] || '?').toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium" style={{ color: theme.textColor }}>
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="truncate text-xs" style={{ color: theme.subtextColor }}>
                      {user.email}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
