import { Mail, Users } from 'lucide-react';
import {
  PremiumDateTimePicker,
  type PremiumControlPalette,
} from '@/shared/components/premium-form-controls';
import type { FormsViewProps } from './types';
import { formBodyClass, inviteScrollStyle, labelClass } from './formStyles';
import { controlClass, getInputStyle, InviteTextField } from './InviteTextField';
import { InviteErrorAlert } from './InviteErrorAlert';
import { InviteFooter } from './InviteFooter';
import { InviteInfoHint } from './InviteInfoHint';
import { InviteRoleSelector } from './InviteRoleSelector';
import styles from './InviteForm.module.css';

type BulkInviteFormProps = Omit<FormsViewProps, 'mode'>;

export function BulkInviteForm({ controller, onClose, theme }: BulkInviteFormProps) {
  const { bulkForm, error, handleBulkSubmit, roleLabels, setBulkForm, status, t } = controller;
  const optionalLabel = t('common.optional', 'Opcional');
  const controlPalette: PremiumControlPalette = {
    accentColor: theme.accentColor,
    borderColor: theme.borderColor,
    inputBg: theme.inputBg,
    menuBg: theme.menuBg,
    mutedText: theme.mutedText,
    onPrimaryColor: theme.onPrimaryColor,
    primaryColor: theme.primaryColor,
    surfaceColor: theme.surfaceColor,
    textColor: theme.textColor,
  };

  return (
    <form className={styles.form} onSubmit={handleBulkSubmit}>
      <div className={formBodyClass} style={inviteScrollStyle}>
        <InviteErrorAlert error={error} />
        <div className={styles.fieldGrid}>
          <InviteTextField icon={Mail} label={t('users.modals.bulkInvite.fields.name', 'Nombre del enlace')} optionalLabel={optionalLabel} theme={theme}>
            <input
              className={controlClass}
              disabled={status === 'loading'}
              maxLength={100}
              onChange={(event) => setBulkForm((form) => ({ ...form, name: event.target.value }))}
              placeholder="Ej: Invitacion Equipo de Ventas"
              style={getInputStyle(theme)}
              type="text"
              value={bulkForm.name}
            />
          </InviteTextField>
          <InviteTextField icon={Users} label={t('users.modals.bulkInvite.fields.maxUses', 'Numero maximo de registros')} required theme={theme}>
            <input
              className={controlClass}
              disabled={status === 'loading'}
              max={10000}
              min={1}
              onChange={(event) => setBulkForm((form) => ({ ...form, maxUses: parseInt(event.target.value, 10) || 0 }))}
              required
              style={getInputStyle(theme)}
              type="number"
              value={bulkForm.maxUses}
            />
          </InviteTextField>
        </div>
        <div className={styles.fieldGrid}>
          <div className={styles.roleSection}>
            <label className={labelClass} style={{ color: theme.mutedText }}>
              {t('users.modals.bulkInvite.fields.role', 'Rol asignado')} <span className={styles.required}>*</span>
            </label>
            <InviteRoleSelector form={bulkForm} onRoleChange={(role) => setBulkForm((form) => ({ ...form, role }))} roleLabels={roleLabels} status={status} theme={theme} />
          </div>
          <div className={styles.field}>
            <label className={labelClass} style={{ color: theme.mutedText }}>
              {t('users.modals.bulkInvite.fields.expiresAt', 'Fecha de expiracion')}{' '}
              <span className={styles.required}>*</span>
            </label>
            <PremiumDateTimePicker
              ariaLabel={t('users.modals.bulkInvite.fields.expiresAt', 'Fecha de expiracion')}
              disabled={status === 'loading'}
              min={new Date().toISOString().slice(0, 16)}
              mode="datetime"
              onChange={(expiresAt) =>
                setBulkForm((form) => ({ ...form, expiresAt }))
              }
              palette={controlPalette}
              placeholder={t(
                'users.modals.bulkInvite.fields.selectExpiration',
                'Selecciona fecha y hora',
              )}
              value={bulkForm.expiresAt}
            />
          </div>
        </div>
        <InviteInfoHint message={t('users.modals.bulkInvite.hints.info', 'El enlace permitira registros masivos con el rol especificado.')} theme={theme} />
      </div>
      <InviteFooter
        icon="link"
        loadingLabel={t('users.buttons.creating', 'Creando...')}
        modeLabel={t('users.modals.unified.tabs.bulk', 'Enlace')}
        onClose={onClose}
        status={status}
        submitLabel={t('users.buttons.createLink', 'Crear Enlace')}
        t={t}
        theme={theme}
      />
    </form>
  );
}
