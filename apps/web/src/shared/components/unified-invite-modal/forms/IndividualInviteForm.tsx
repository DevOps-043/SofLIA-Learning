import { Briefcase, Mail, MessageSquare } from 'lucide-react';
import type { FormsViewProps } from './types';
import { formBodyClass, inviteScrollStyle, labelClass } from './formStyles';
import { controlClass, getInputStyle, InviteTextField } from './InviteTextField';
import { InviteErrorAlert } from './InviteErrorAlert';
import { InviteFooter } from './InviteFooter';
import { InviteInfoHint } from './InviteInfoHint';
import { InviteRoleSelector } from './InviteRoleSelector';

type IndividualInviteFormProps = Omit<FormsViewProps, 'mode'>;

export function IndividualInviteForm({ controller, onClose, theme }: IndividualInviteFormProps) {
  const { error, handleIndividualSubmit, individualForm, roleLabels, setIndividualForm, status, t } = controller;
  const optionalLabel = t('common.optional', 'Opcional');

  return (
    <form className="flex h-full flex-col overflow-hidden" onSubmit={handleIndividualSubmit}>
      <div className={formBodyClass} style={inviteScrollStyle}>
        <InviteErrorAlert error={error} />
        <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2">
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
        <div className="space-y-4">
          <label className={labelClass} style={{ color: theme.mutedText }}>
            {t('users.modals.invite.fields.role', 'Rol en la organizacion')} <span className="text-red-400">*</span>
          </label>
          <InviteRoleSelector form={individualForm} onRoleChange={(role) => setIndividualForm((form) => ({ ...form, role }))} roleLabels={roleLabels} status={status} theme={theme} />
        </div>
        <div className="space-y-3">
          <label className={labelClass} style={{ color: theme.mutedText }}>
            {t('users.modals.invite.fields.message', 'Mensaje personalizado')}
            <span className="ml-1 uppercase opacity-40">({optionalLabel})</span>
          </label>
          <div className="group relative">
            <MessageSquare className="absolute left-4 top-4 h-4 w-4 transition-colors" style={{ color: theme.mutedText }} />
            <textarea
              className="w-full resize-none rounded-[2rem] border bg-transparent py-4 pl-12 pr-4 text-xs font-medium transition-all focus:outline-none sm:text-sm"
              disabled={status === 'loading'}
              maxLength={500}
              onChange={(event) => setIndividualForm((form) => ({ ...form, customMessage: event.target.value }))}
              placeholder="Agrega un mensaje de bienvenida..."
              rows={3}
              style={getInputStyle(theme)}
              value={individualForm.customMessage}
            />
            <p className="absolute bottom-4 right-6 text-[10px] font-black uppercase tracking-widest opacity-20" style={{ color: theme.mutedText }}>
              {individualForm.customMessage.length}/500
            </p>
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
