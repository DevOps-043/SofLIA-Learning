import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import type { UnifiedInviteTheme } from '../types';
import { controlClass } from './formStyles';
import styles from './InviteForm.module.css';

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
    <div className={styles.field}>
      <label className={styles.label} style={{ color: theme.mutedText }}>
        {label}
        {required && <span className={styles.required}> *</span>}
        {optionalLabel && <span className={styles.optional}>({optionalLabel})</span>}
      </label>
      <div className={styles.controlWrap}>
        <Icon aria-hidden="true" />
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
