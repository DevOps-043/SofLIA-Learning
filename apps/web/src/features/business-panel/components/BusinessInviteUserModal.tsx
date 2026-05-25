'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme';
import { InviteFormContent } from './BusinessInviteUserModal/InviteFormContent';
import { InviteFormFooter } from './BusinessInviteUserModal/InviteFormFooter';
import { InviteModalHeader } from './BusinessInviteUserModal/InviteModalHeader';
import { InviteSuccessState } from './BusinessInviteUserModal/InviteSuccessState';
import type { BusinessInviteUserModalProps } from './BusinessInviteUserModal/types';
import {
  getInviteRoleLabels,
  useBusinessInviteUserModal
} from './BusinessInviteUserModal/useBusinessInviteUserModal';

export function BusinessInviteUserModal({
  isOpen,
  onClose,
  onInviteSent,
  organizationId
}: BusinessInviteUserModalProps) {
  const { t } = useTranslation('business');
  const theme = useBusinessPanelTheme();
  const inviteState = useBusinessInviteUserModal({
    isOpen,
    onClose,
    onInviteSent,
    organizationId,
    t
  });

  if (!isOpen) {
    return null;
  }

  const roleLabels = getInviteRoleLabels(t);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 backdrop-blur-sm"
          style={{ backgroundColor: theme.overlayBg }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg max-h-[90vh] flex flex-col"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="rounded-2xl shadow-2xl overflow-hidden border flex flex-col max-h-full" style={{ backgroundColor: theme.panelBg, borderColor: theme.borderColor }}>
            <InviteModalHeader onClose={onClose} t={t} theme={theme} />
            {inviteState.status === 'success' ? (
              <InviteSuccessState message={inviteState.successMessage} t={t} theme={theme} />
            ) : (
              <form onSubmit={inviteState.handleSubmit} className="flex flex-col overflow-hidden h-full">
                <InviteFormContent
                  error={inviteState.error}
                  formData={inviteState.formData}
                  handleChange={inviteState.handleChange}
                  roleLabels={roleLabels}
                  setFormData={inviteState.setFormData}
                  status={inviteState.status}
                  t={t}
                  theme={theme}
                />
                <InviteFormFooter onClose={onClose} status={inviteState.status} t={t} theme={theme} />
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
