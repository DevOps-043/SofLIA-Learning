import { Sparkles } from 'lucide-react';
import type { UnifiedInviteTheme } from '../types';
import styles from './InviteForm.module.css';

export function InviteInfoHint({ message, theme }: { message: string; theme: UnifiedInviteTheme }) {
  return (
    <div className={styles.hint} style={{ color: theme.mutedText }}>
      <Sparkles aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
