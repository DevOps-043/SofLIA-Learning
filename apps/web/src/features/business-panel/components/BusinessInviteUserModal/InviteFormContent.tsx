import type React from 'react';
import { Briefcase, Mail, MessageSquare } from 'lucide-react';
import { InviteErrorMessage } from './InviteErrorMessage';
import { InviteInfoNote } from './InviteInfoNote';
import { InviteRoleSelector } from './InviteRoleSelector';
import { InviteTextField } from './InviteTextField';
import type { BusinessInviteTheme, InviteFormData, InviteRoleLabel, InviteStatus } from './types';

interface InviteFormContentProps {
  error: string | null;
  formData: InviteFormData;
  handleChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  roleLabels: Record<InviteFormData['role'], InviteRoleLabel>;
  setFormData: React.Dispatch<React.SetStateAction<InviteFormData>>;
  status: InviteStatus;
  t: (key: string, fallback?: string) => string;
  theme: BusinessInviteTheme;
}

export function InviteFormContent({
  error,
  formData,
  handleChange,
  roleLabels,
  setFormData,
  status,
  t,
  theme
}: InviteFormContentProps) {
  const optionalLabel = t('common.optional', 'Opcional');

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5" style={{ scrollbarWidth: 'thin', scrollbarColor: `${theme.borderColor} transparent` }}>
      <InviteErrorMessage error={error} theme={theme} />
      <InviteTextField icon={Mail} label={t('users.modals.invite.fields.email', 'Correo electronico')} name="email" value={formData.email} onChange={handleChange} required status={status} theme={theme} type="email" placeholder={t('users.modals.invite.placeholders.email', 'usuario@empresa.com')} />
      <InviteRoleSelector
        formData={formData}
        roleLabels={roleLabels}
        setFormData={setFormData}
        status={status}
        t={t}
        theme={theme}
      />
      <InviteTextField icon={Briefcase} label={t('users.modals.invite.fields.position', 'Cargo / Posicion')} name="position" value={formData.position} onChange={handleChange} optionalLabel={optionalLabel} status={status} theme={theme} placeholder={t('users.modals.invite.placeholders.position', 'Ej: Gerente de Ventas')} maxLength={100} />
      <InviteTextField icon={MessageSquare} label={t('users.modals.invite.fields.message', 'Mensaje personalizado')} name="customMessage" value={formData.customMessage} onChange={handleChange} optionalLabel={optionalLabel} status={status} theme={theme} placeholder={t('users.modals.invite.placeholders.message', 'Agrega un mensaje personalizado para el destinatario...')} maxLength={500} rows={3} />
      <InviteInfoNote t={t} theme={theme} />
    </div>
  );
}
