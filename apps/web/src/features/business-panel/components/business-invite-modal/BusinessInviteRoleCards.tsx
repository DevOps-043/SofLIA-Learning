'use client'

import { Shield } from 'lucide-react'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import type { BusinessInviteRole } from '../../services/business-invite-modal.service'

interface BusinessInviteRoleCardsProps {
  currentRole: BusinessInviteRole
  disabled: boolean
  roleLabels: Record<BusinessInviteRole, { label: string; desc: string }>
  onSelect: (role: BusinessInviteRole) => void
}

export function BusinessInviteRoleCards({
  currentRole,
  disabled,
  roleLabels,
  onSelect,
}: BusinessInviteRoleCardsProps) {
  const theme = useBusinessPanelTheme()

  return (
    <div className="grid grid-cols-3 gap-2">
      {(['member', 'admin', 'owner'] as const).map((role) => {
        const isSelected = currentRole === role
        const roleTheme = theme.roleColors[role]

        return (
          <button
            key={role}
            type="button"
            onClick={() => onSelect(role)}
            disabled={disabled}
            className="rounded-xl border p-3 text-left transition-all disabled:opacity-50"
            style={{
              backgroundColor: isSelected ? roleTheme.bg : theme.inputBg,
              borderColor: isSelected ? roleTheme.text : theme.borderColor,
            }}
          >
            <div className="mb-1 flex items-center gap-2">
              <Shield
                className="h-4 w-4"
                style={{ color: isSelected ? roleTheme.text : theme.subtextColor }}
              />
              <span
                className="text-sm font-medium"
                style={{ color: isSelected ? roleTheme.text : theme.textColor }}
              >
                {roleLabels[role].label}
              </span>
            </div>

            <p className="hidden text-xs sm:block" style={{ color: theme.subtextColor }}>
              {roleLabels[role].desc}
            </p>
          </button>
        )
      })}
    </div>
  )
}
