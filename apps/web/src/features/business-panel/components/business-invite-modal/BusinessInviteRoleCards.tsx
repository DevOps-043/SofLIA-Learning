'use client';

import { Shield } from 'lucide-react';
import type { BusinessInviteRole } from '../../services/business-invite-modal.service';

interface BusinessInviteRoleCardsProps {
  currentRole: BusinessInviteRole;
  disabled: boolean;
  isDark: boolean;
  inputBg: string;
  borderColor: string;
  primaryColor: string;
  mutedText: string;
  textColor: string;
  roleLabels: Record<BusinessInviteRole, { label: string; desc: string }>;
  onSelect: (role: BusinessInviteRole) => void;
}

export function BusinessInviteRoleCards({
  currentRole,
  disabled,
  isDark,
  inputBg,
  borderColor,
  primaryColor,
  mutedText,
  textColor,
  roleLabels,
  onSelect,
}: BusinessInviteRoleCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {(['member', 'admin', 'owner'] as const).map((role) => (
        <button
          key={role}
          type="button"
          onClick={() => onSelect(role)}
          disabled={disabled}
          className="p-3 rounded-xl border text-left transition-all disabled:opacity-50"
          style={{
            backgroundColor: currentRole === role ? (isDark ? `${primaryColor}30` : `${primaryColor}10`) : inputBg,
            borderColor: currentRole === role ? primaryColor : borderColor,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Shield
              className="w-4 h-4"
              style={{ color: currentRole === role ? (isDark ? '#FFFFFF' : primaryColor) : mutedText }}
            />
            <span
              className="text-sm font-medium"
              style={{ color: currentRole === role ? (isDark ? '#FFFFFF' : primaryColor) : textColor }}
            >
              {roleLabels[role].label}
            </span>
          </div>
          <p className="text-xs hidden sm:block" style={{ color: mutedText }}>
            {roleLabels[role].desc}
          </p>
        </button>
      ))}
    </div>
  );
}
