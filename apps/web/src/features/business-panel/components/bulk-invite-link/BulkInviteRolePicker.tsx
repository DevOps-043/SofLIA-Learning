'use client'

import { Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { InviteRole, ModalStatus, RoleLabels } from './types'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'

interface BulkInviteRolePickerProps {
  role: InviteRole
  roleLabels: RoleLabels
  status: ModalStatus
  onRoleChange: (role: InviteRole) => void
}

export function BulkInviteRolePicker({
  role,
  roleLabels,
  status,
  onRoleChange,
}: BulkInviteRolePickerProps) {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()

  return (
    <div>
      <label
        className="block text-sm font-medium mb-2"
        style={{ color: theme.mutedTextColor }}
      >
        {t('users.modals.bulkInvite.fields.role', 'Rol asignado')}{' '}
        <span className="text-red-400">*</span>
      </label>
      <div className="grid grid-cols-3 gap-2">
        {(['member'] as const).map((option) => {
          const isSelected = role === option

          return (
            <button
              key={option}
              type="button"
              onClick={() => onRoleChange(option)}
              disabled={status === 'loading'}
              className="p-3 rounded-xl border text-left transition-all disabled:opacity-50"
              style={{
                backgroundColor: isSelected
                  ? theme.primaryColor
                  : theme.inputBg,
                borderColor: isSelected
                  ? theme.primaryColor
                  : theme.borderColor,
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Shield
                  className="w-4 h-4"
                  style={{
                    color: isSelected
                      ? theme.onPrimaryColor
                      : theme.mutedTextColor,
                  }}
                />
                <span
                  className="text-sm font-medium"
                  style={{
                    color: isSelected ? theme.onPrimaryColor : theme.textColor,
                  }}
                >
                  {roleLabels[option].label}
                </span>
              </div>
              <p
                className="text-xs hidden sm:block"
                style={{
                  color: isSelected
                    ? theme.onPrimaryColor
                    : theme.mutedTextColor,
                }}
              >
                {roleLabels[option].desc}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
