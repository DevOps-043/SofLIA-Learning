import { Briefcase, Mail, MessageSquare } from 'lucide-react';
import type { FormsViewProps } from './types';
import { formBodyClass, inviteScrollStyle, labelClass } from './formStyles';
import { controlClass, getInputStyle, InviteTextField } from './InviteTextField';
import { InviteErrorAlert } from './InviteErrorAlert';
import { InviteFooter } from './InviteFooter';
import { InviteInfoHint } from './InviteInfoHint';
import { InviteRoleSelector } from './InviteRoleSelector';
import styles from './InviteForm.module.css';

type IndividualInviteFormProps = Omit<FormsViewProps, 'mode'>;

export function IndividualInviteForm({ controller, onClose, theme }: IndividualInviteFormProps) {
  const { error, handleIndividualSubmit, individualForm, roleLabels, setIndividualForm, status, t } = controller;
  const optionalLabel = t('common.optional', 'Opcional');

  return (
    <form className={styles.form} onSubmit={handleIndividualSubmit}>
      <div className={formBodyClass} style={inviteScrollStyle}>
        <InviteErrorAlert error={error} />
        <div className={styles.fieldGrid}>
          <InviteTextField icon={Mail} label={t('users.modals.invite.fields.email', 'Email Address')} required theme={theme}>
            <input
              className={controlClass}
              disabled={status === 'loading'}
              onChange={(event) => setIndividualForm((form) => ({ ...form, email: event.target.value }))}
              placeholder="usuario@empresa.com"
              required
              style={getInputStyle(theme)}
              type="email"
              value={individualForm.email}
            />
          </InviteTextField>
          <InviteTextField icon={Briefcase} label={t('users.modals.invite.fields.position', 'Cargo / Posicion')} optionalLabel={optionalLabel} theme={theme}>
            <input
              className={controlClass}
              disabled={status === 'loading'}
              maxLength={100}
              onChange={(event) => setIndividualForm((form) => ({ ...form, position: event.target.value }))}
              placeholder="Ej: Gerente de Ventas"
              style={getInputStyle(theme)}
              type="text"
              value={individualForm.position}
            />
          </InviteTextField>
        </div>
        <div className={styles.roleSection}>
          <label className={labelClass} style={{ color: theme.mutedText }}>
            {t('users.modals.invite.fields.role', 'Rol en la organización')} <span className={styles.required}>*</span>
          </label>
          <InviteRoleSelector form={individualForm} onRoleChange={(role) => setIndividualForm((form) => ({ ...form, role }))} roleLabels={roleLabels} status={status} theme={theme} />
        </div>
        <div className={styles.field}>
          <label className={labelClass} style={{ color: theme.mutedText }}>
            {t('users.modals.invite.fields.message', 'Mensaje personalizado')}
            <span className={styles.optional}>({optionalLabel})</span>
          </label>
          <div className={styles.textareaWrap}>
            <MessageSquare aria-hidden="true" />
            <textarea
              className={styles.textarea}
              disabled={status === 'loading'}
              maxLength={500}
              onChange={(event) => setIndividualForm((form) => ({ ...form, customMessage: event.target.value }))}
              placeholder="Agrega un mensaje de bienvenida..."
              rows={3}
              style={getInputStyle(theme)}
              value={individualForm.customMessage}
            />
            <span className={styles.counter} style={{ color: theme.mutedText }}>
              {individualForm.customMessage.length}/500
            </span>
          </div>
        </div>
        <InviteInfoHint message={t('users.modals.invite.hints.info', 'El usuario recibira un correo con el enlace. Expira en 7 dias.')} theme={theme} />
      </div>
      <InviteFooter
        icon="send"
        loadingLabel={t('users.buttons.sending', 'Enviando...')}
        modeLabel={t('users.modals.unified.tabs.individual', 'Individual')}
        onClose={onClose}
        status={status}
        submitLabel={t('users.buttons.sendInvite', 'Enviar Invitacion')}
        t={t}
        theme={theme}
      />
    </form>
  );
}
