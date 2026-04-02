'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Link2, List, Mail, X } from 'lucide-react';
import { UnifiedInviteFormsView } from './UnifiedInviteFormsView';
import { UnifiedInviteManageLinksView } from './UnifiedInviteManageLinksView';
import { UnifiedInviteSuccessView } from './UnifiedInviteSuccessView';
import type { UnifiedInviteModalProps } from './types';

export function UnifiedInviteModal({
  controller,
  isOpen,
  onClose,
  theme,
}: UnifiedInviteModalProps) {
  const { mode, setError, setMode, setStatus, status, t } = controller;

  if (!isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 flex items-center justify-center p-4"
        style={{ zIndex: 99999 }}
      >
        <motion.div
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={onClose}
        />

        <motion.div
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative w-full max-w-2xl max-h-[90vh] flex flex-col"
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(event) => event.stopPropagation()}
          transition={{ duration: 0.2 }}
        >
          <div
            className="rounded-2xl shadow-2xl overflow-hidden border flex flex-col max-h-full"
            style={{
              backgroundColor: theme.surfaceColor,
              borderColor: theme.borderColor,
            }}
          >
            <div
              className="p-6 border-b shrink-0"
              style={{
                background: theme.headerGradient,
                borderColor: theme.borderColor,
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    className="p-2 rounded-xl"
                    style={{ backgroundColor: `${theme.accentColor}20` }}
                    transition={{
                      duration: 20,
                      ease: 'linear',
                      repeat: Number.POSITIVE_INFINITY,
                    }}
                  >
                    {mode === 'individual' ? (
                      <Mail className="w-6 h-6" style={{ color: theme.accentColor }} />
                    ) : mode === 'bulk' ? (
                      <Link2
                        className="w-6 h-6"
                        style={{ color: theme.accentColor }}
                      />
                    ) : (
                      <List className="w-6 h-6" style={{ color: theme.accentColor }} />
                    )}
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: theme.textColor }}>
                      {t('users.modals.unified.title', 'Invitar Usuarios')}
                    </h3>
                    <p className="text-sm" style={{ color: theme.mutedText }}>
                      {mode === 'manage'
                        ? t(
                            'users.modals.unified.subtitleManage',
                            'Gestiona tus enlaces de invitacion'
                          )
                        : t(
                            'users.modals.unified.subtitle',
                            'Elige como quieres invitar'
                          )}
                    </p>
                  </div>
                </div>
                <button
                  className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  onClick={onClose}
                >
                  <X className="w-5 h-5" style={{ color: theme.mutedText }} />
                </button>
              </div>

              {status !== 'success' && (
                <div className="flex gap-2">
                  {[
                    {
                      icon: Mail,
                      key: 'individual' as const,
                      label: t('users.modals.unified.tabs.individual', 'Individual'),
                      mobileLabel: 'Email',
                    },
                    {
                      icon: Link2,
                      key: 'bulk' as const,
                      label: t('users.modals.unified.tabs.bulk', 'Enlace Masivo'),
                      mobileLabel: 'Enlace',
                    },
                    {
                      icon: List,
                      key: 'manage' as const,
                      label: t('users.modals.unified.tabs.manage', 'Ver Enlaces'),
                      mobileLabel: 'Ver',
                    },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = mode === tab.key;

                    return (
                      <button
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all"
                        key={tab.key}
                        onClick={() => {
                          setMode(tab.key);
                          setError(null);
                          setStatus('idle');
                        }}
                        style={{
                          backgroundColor: isActive
                            ? theme.isDark
                              ? `${theme.primaryColor}30`
                              : `${theme.primaryColor}15`
                            : theme.inputBg,
                          border: isActive
                            ? `2px solid ${theme.primaryColor}`
                            : '2px solid transparent',
                          color: isActive
                            ? theme.isDark
                              ? '#FFFFFF'
                              : theme.primaryColor
                            : theme.mutedText,
                        }}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{tab.label}</span>
                        <span className="sm:hidden">{tab.mobileLabel}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {status === 'success' ? (
              <UnifiedInviteSuccessView
                controller={controller}
                mode={mode === 'individual' ? 'individual' : 'bulk'}
                onClose={onClose}
                theme={theme}
              />
            ) : mode === 'manage' ? (
              <UnifiedInviteManageLinksView
                controller={controller}
                onClose={onClose}
                theme={theme}
              />
            ) : (
              <UnifiedInviteFormsView
                controller={controller}
                mode={mode}
                onClose={onClose}
                theme={theme}
              />
            )}
          </div>
        </motion.div>

        {controller.openMenuId && (
          <div
            className="fixed inset-0"
            onClick={() => controller.setOpenMenuId(null)}
            style={{ zIndex: 99998 }}
          />
        )}
      </div>
    </AnimatePresence>
  );
}
