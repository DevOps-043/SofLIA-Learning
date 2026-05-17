import type React from 'react';
import { useEffect, useState } from 'react';
import type { TFunction } from 'i18next';
import { inviteUserAction } from '@/features/auth/actions/invitation';
import type { InviteFormData, InviteRoleLabel, InviteStatus } from './types';

const EMPTY_INVITE_FORM: InviteFormData = {
  customMessage: '',
  email: '',
  position: '',
  role: 'member'
};

export function useBusinessInviteUserModal({
  isOpen,
  onClose,
  onInviteSent,
  organizationId,
  t
}: {
  isOpen: boolean;
  onClose: () => void;
  onInviteSent?: () => void;
  organizationId?: string;
  t: TFunction<'business'>;
}) {
  const [formData, setFormData] = useState<InviteFormData>(EMPTY_INVITE_FORM);
  const [status, setStatus] = useState<InviteStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setFormData(EMPTY_INVITE_FORM);
      setStatus('idle');
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('loading');
    setError(null);

    try {
      if (!organizationId) throw new Error(t('users.modals.invite.errorNoOrg'));
      const result = await inviteUserAction({
        customMessage: formData.customMessage || undefined,
        email: formData.email,
        organizationId,
        position: formData.position || undefined,
        role: formData.role
      });
      if (result.error) throw new Error(result.error);
      setStatus('success');
      setSuccessMessage(t('users.modals.invite.success.message', { email: formData.email }));
      setTimeout(() => {
        onInviteSent?.();
        onClose();
      }, 2000);
    } catch (caughtError) {
      setStatus('error');
      setError(caughtError instanceof Error ? caughtError.message : t('users.modals.invite.errorSend'));
    }
  };

  return { error, formData, handleChange, handleSubmit, setFormData, status, successMessage };
}

export function getInviteRoleLabels(t: TFunction<'business'>): Record<InviteFormData['role'], InviteRoleLabel> {
  return {
    admin: {
      desc: t('users.modals.invite.roleDesc.admin', 'Puede gestionar usuarios y contenido'),
      label: t('users.roles.admin', 'Administrador')
    },
    member: {
      desc: t('users.modals.invite.roleDesc.member', 'Acceso basico a la plataforma'),
      label: t('users.roles.member', 'Miembro')
    },
    owner: {
      desc: t('users.modals.invite.roleDesc.owner', 'Control total de la organizacion'),
      label: t('users.roles.owner', 'Propietario')
    }
  };
}
