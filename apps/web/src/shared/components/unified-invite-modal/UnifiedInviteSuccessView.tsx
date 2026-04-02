'use client';

import { motion } from 'framer-motion';
import {
  Calendar,
  Check,
  CheckCircle,
  Copy,
  Shield,
  Users,
} from 'lucide-react';
import type {
  UnifiedInviteModalController,
  UnifiedInviteTheme,
} from './types';

interface UnifiedInviteSuccessViewProps {
  controller: UnifiedInviteModalController;
  mode: 'bulk' | 'individual';
  onClose: () => void;
  theme: UnifiedInviteTheme;
}

export function UnifiedInviteSuccessView({
  controller,
  mode,
  onClose,
  theme,
}: UnifiedInviteSuccessViewProps) {
  const {
    copied,
    createdLink,
    getInviteUrl,
    handleCopy,
    handleCreateAnother,
    roleLabels,
    successEmail,
    t,
  } = controller;

  if (mode === 'individual') {
    return (
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="p-8 flex flex-col items-center justify-center text-center"
        initial={{ opacity: 0, y: 20 }}
      >
        <motion.div
          animate={{ scale: 1 }}
          className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
          initial={{ scale: 0 }}
          style={{ backgroundColor: `${theme.accentColor}20` }}
          transition={{ delay: 0.1, stiffness: 200, type: 'spring' }}
        >
          <CheckCircle className="w-10 h-10" style={{ color: theme.accentColor }} />
        </motion.div>
        <h4 className="text-xl font-bold mb-2" style={{ color: theme.textColor }}>
          {t('users.modals.invite.success.title', 'Invitacion enviada')}
        </h4>
        <p style={{ color: theme.mutedText }}>
          {t(
            'users.modals.invite.success.message',
            'Invitacion enviada exitosamente a'
          )}{' '}
          {successEmail}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6"
      initial={{ opacity: 0, y: 20 }}
    >
      <div className="text-center">
        <motion.div
          animate={{ scale: 1 }}
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
          initial={{ scale: 0 }}
          style={{ backgroundColor: `${theme.accentColor}20` }}
          transition={{ delay: 0.1, stiffness: 200, type: 'spring' }}
        >
          <CheckCircle className="w-10 h-10" style={{ color: theme.accentColor }} />
        </motion.div>
        <h4 className="text-xl font-bold mb-2" style={{ color: theme.textColor }}>
          {t('users.modals.bulkInvite.success.title', 'Enlace creado')}
        </h4>
        <p style={{ color: theme.mutedText }}>
          {t(
            'users.modals.bulkInvite.success.subtitle',
            'Comparte este enlace con las personas que deseas invitar'
          )}
        </p>
      </div>

      <div
        className="p-4 rounded-xl border"
        style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}
      >
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium mb-1" style={{ color: theme.mutedText }}>
              {t('users.modals.bulkInvite.success.linkLabel', 'Enlace de invitacion')}
            </p>
            <p className="text-sm font-mono truncate" style={{ color: theme.textColor }}>
              {getInviteUrl()}
            </p>
          </div>
          <button
            className="p-2 rounded-lg transition-colors flex-shrink-0"
            onClick={() => {
              void handleCopy();
            }}
            style={{
              backgroundColor: copied ? `${theme.accentColor}20` : theme.inputBg,
              color: copied ? theme.accentColor : theme.textColor,
            }}
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {createdLink && (
        <div className="grid grid-cols-3 gap-3">
          <div
            className="p-3 rounded-xl text-center"
            style={{ backgroundColor: theme.inputBg }}
          >
            <Users
              className="w-5 h-5 mx-auto mb-1"
              style={{ color: theme.accentColor }}
            />
            <p className="text-lg font-bold" style={{ color: theme.textColor }}>
              {createdLink.max_uses}
            </p>
            <p className="text-xs" style={{ color: theme.mutedText }}>
              {t('users.modals.bulkInvite.success.maxUsers', 'Max. usuarios')}
            </p>
          </div>
          <div
            className="p-3 rounded-xl text-center"
            style={{ backgroundColor: theme.inputBg }}
          >
            <Shield
              className="w-5 h-5 mx-auto mb-1"
              style={{ color: theme.accentColor }}
            />
            <p
              className="text-lg font-bold capitalize"
              style={{ color: theme.textColor }}
            >
              {roleLabels[createdLink.role as keyof typeof roleLabels]?.label ||
                createdLink.role}
            </p>
            <p className="text-xs" style={{ color: theme.mutedText }}>
              {t('users.modals.bulkInvite.success.role', 'Rol')}
            </p>
          </div>
          <div
            className="p-3 rounded-xl text-center"
            style={{ backgroundColor: theme.inputBg }}
          >
            <Calendar
              className="w-5 h-5 mx-auto mb-1"
              style={{ color: theme.accentColor }}
            />
            <p className="text-lg font-bold" style={{ color: theme.textColor }}>
              {new Date(createdLink.expires_at).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
              })}
            </p>
            <p className="text-xs" style={{ color: theme.mutedText }}>
              {t('users.modals.bulkInvite.success.expires', 'Expira')}
            </p>
          </div>
        </div>
      )}

      <div
        className="flex items-center justify-end gap-3 pt-4 border-t"
        style={{ borderColor: theme.borderColor }}
      >
        <button
          className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          onClick={handleCreateAnother}
          style={{ color: theme.mutedText }}
        >
          {t('users.buttons.createAnother', 'Crear otro')}
        </button>
        <motion.button
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-white"
          onClick={onClose}
          style={{
            backgroundColor: theme.primaryColor,
            boxShadow: `0 4px 15px ${theme.primaryColor}40`,
            color: '#FFFFFF',
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {t('users.buttons.done', 'Listo')}
        </motion.button>
      </div>
    </motion.div>
  );
}
