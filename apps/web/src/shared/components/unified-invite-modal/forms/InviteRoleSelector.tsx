import { Shield } from 'lucide-react';
import type { BulkInviteForm, IndividualInviteForm } from '../types';
import styles from './InviteForm.module.css';
import type { RoleSelectorProps } from './types';

export function InviteRoleSelector<TForm extends BulkInviteForm | IndividualInviteForm>({
  form,
  onRoleChange,
  roleLabels,
  status,
}: RoleSelectorProps<TForm>) {
  return (
    <div className={styles.roleGrid}>
      {(['member', 'admin', 'owner'] as const).map((role) => {
        const isActive = form.role === role;
        return (
          <button
            aria-pressed={isActive}
            className={isActive ? styles.roleActive : styles.role}
            disabled={status === 'loading'}
            key={role}
            onClick={() => onRoleChange(role)}
            type="button"
          >
            <span className={styles.roleIcon} aria-hidden="true"><Shield /></span>
            <span className={styles.roleCopy}>
              <strong>{roleLabels[role].label}</strong>
              <span>{roleLabels[role].desc}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
