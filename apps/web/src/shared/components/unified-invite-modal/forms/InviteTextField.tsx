import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import type { UnifiedInviteTheme } from '../types';
import { controlClass, labelClass } from './formStyles';

interface InviteTextFieldProps {
  icon: LucideIcon;
  label: string;
  optionalLabel?: string;
  required?: boolean;
  children: ReactNode;
  theme: UnifiedInviteTheme;
}

export function InviteTextField({ children, icon: Icon, label, optionalLabel, required, theme }: InviteTextFieldProps) {
  return (
    <div className="space-y-3">
      <label className={labelClass} style={{ color: theme.mutedText }}>
        {label} {required && <span className="text-red-400">*</span>}
        {optionalLabel && <span className="ml-1 uppercase opacity-40">({optionalLabel})</span>}
      </label>
      <div className="group relative">
        <Icon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors" style={{ color: theme.mutedText }} />
        {children}
      </div>
    </div>
  );
}

export function getInputStyle(theme: UnifiedInviteTheme) {
  return {
    backgroundColor: theme.inputBg,
    borderColor: theme.borderColor,
    color: theme.textColor,
  };
}

export { controlClass };
