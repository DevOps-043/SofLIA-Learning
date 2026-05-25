import { Calendar, Mail, Users } from 'lucide-react';
import type { FormsViewProps } from './types';
import { formBodyClass, inviteScrollStyle, labelClass } from './formStyles';
import { controlClass, getInputStyle, InviteTextField } from './InviteTextField';
import { InviteErrorAlert } from './InviteErrorAlert';
import { InviteFooter } from './InviteFooter';
import { InviteInfoHint } from './InviteInfoHint';
import { InviteRoleSelector } from './InviteRoleSelector';

type BulkInviteFormProps = Omit<FormsViewProps, 'mode'>;

export function BulkInviteForm({ controller, onClose, theme }: BulkInviteFormProps) {
  const { bulkForm, error, handleBulkSubmit, roleLabels, setBulkForm, status, t } = controller;
  const optionalLabel = t('common.optional', 'Opcional');

  return (
    <form className="flex h-full flex-col overflow-hidden" onSubmit={handleBulkSubmit}>
      <div className={formBodyClass} style={inviteScrollStyle}>
        <InviteErrorAlert error={error} />
        <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2">
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
        <div className="grid grid-cols-1 items-end gap-6 sm:gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <label className={labelClass} style={{ color: theme.mutedText }}>
              {t('users.modals.bulkInvite.fields.role', 'Rol asignado')} <span className="text-red-400">*</span>
            </label>
            <InviteRoleSelector form={bulkForm} onRoleChange={(role) => setBulkForm((form) => ({ ...form, role }))} roleLabels={roleLabels} status={status} theme={theme} />
          </div>
          <InviteTextField icon={Calendar} label={t('users.modals.bulkInvite.fields.expiresAt', 'Fecha de expiracion')} required theme={theme}>
            <input
              className={`${controlClass} text-sm`}
              disabled={status === 'loading'}
              min={new Date().toISOString().slice(0, 16)}
              onChange={(event) => setBulkForm((form) => ({ ...form, expiresAt: event.target.value }))}
              required
              style={getInputStyle(theme)}
              type="datetime-local"
              value={bulkForm.expiresAt}
            />
          </InviteTextField>
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
