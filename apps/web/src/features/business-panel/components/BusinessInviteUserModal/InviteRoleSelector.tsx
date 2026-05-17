import type React from 'react';
import { Shield } from 'lucide-react';
import type { BusinessInviteTheme, InviteFormData, InviteRole, InviteRoleLabel } from './types';

interface InviteRoleSelectorProps {
  formData: InviteFormData;
  roleLabels: Record<InviteRole, InviteRoleLabel>;
  setFormData: React.Dispatch<React.SetStateAction<InviteFormData>>;
  status: string;
  t: (key: string, fallback?: string) => string;
  theme: BusinessInviteTheme;
}

export function InviteRoleSelector({
  formData,
  roleLabels,
  setFormData,
  status,
  t,
  theme
}: InviteRoleSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2" style={{ color: theme.mutedTextColor }}>
        {t('users.modals.invite.fields.role', 'Rol en la organizacion')} <span className="text-red-400">*</span>
      </label>
      <div className="grid grid-cols-3 gap-2">
        {(['member', 'admin', 'owner'] as const).map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => setFormData((current) => ({ ...current, role }))}
            disabled={status === 'loading'}
            className="p-3 rounded-xl border text-left transition-all disabled:opacity-50"
            style={{
              backgroundColor: formData.role === role ? theme.primaryColor : theme.inputBg,
              borderColor: formData.role === role ? theme.primaryColor : theme.borderColor
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4" style={{ color: formData.role === role ? theme.onPrimaryColor : theme.mutedTextColor }} />
              <span className="text-sm font-medium" style={{ color: formData.role === role ? theme.onPrimaryColor : theme.textColor }}>
                {roleLabels[role].label}
              </span>
            </div>
            <p className="text-xs hidden sm:block" style={{ color: formData.role === role ? theme.onPrimaryColor : theme.mutedTextColor }}>
              {roleLabels[role].desc}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
