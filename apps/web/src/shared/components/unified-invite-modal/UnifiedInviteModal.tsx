'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Link2, List, Mail, X, UserPlus, Info } from 'lucide-react';
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
        className="fixed inset-0 isolate flex h-app-dynamic items-center justify-center overflow-hidden p-0 sm:p-4"
        style={{ zIndex: 99999 }}
      >
        {/* Backdrop - COMPLETELY TRANSPARENT */}
        <motion.div
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-transparent"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal Container - STREECT HEIGHT FOR 13" Laptops */}
        <motion.div
           initial={{ opacity: 0, scale: 0.95, y: 20 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           exit={{ opacity: 0, scale: 0.95, y: 20 }}
           transition={{ type: 'spring', damping: 25, stiffness: 300 }}
           className="relative flex h-full w-full max-w-4xl flex-col overflow-hidden bg-transparent shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] sm:h-[min(calc(var(--soflia-viewport-height)-4rem),700px)] sm:max-h-[700px] sm:rounded-[2.5rem]"
           onClick={(event) => event.stopPropagation()}
        >
          <div
            className="flex flex-col h-full bg-transparent overflow-hidden border"
            style={{
              backgroundColor: theme.surfaceColor,
              borderColor: theme.borderColor,
            }}
          >
            {/* 1. ULTRA COMPACT Hero / Header section */}
            <div className="relative shrink-0 pt-4 sm:pt-6 pb-3 sm:pb-4 px-6 lg:px-12 border-b border-white/5">
               <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                  {/* Icon - Smaller for laptops */}
                  <div className="relative shrink-0">
                    <div
                       className="w-12 h-12 sm:w-16 sm:h-16 rounded-[1.2rem] sm:rounded-[1.5rem] flex items-center justify-center shadow-2xl border-2 sm:border-2"
                       style={{
                          background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
                          borderColor: theme.borderColor,
                       }}
                    >
                       <UserPlus className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: theme.onPrimaryColor }} strokeWidth={2.5} />
                    </div>
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                     <h2 className="text-lg sm:text-xl font-black tracking-tight mb-0.5" style={{ color: theme.textColor }}>
                        {t('users.modals.unified.title', 'Invitar Usuarios')}
                     </h2>
                     <div className="px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-2" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor, color: theme.mutedText }}>
                        <span>{mode === 'manage' ? t('users.modals.unified.subtitleManage', 'Gestiona enlaces') : t('users.modals.unified.subtitle', 'Elige invitación')}</span>
                     </div>
                  </div>

                  {/* Tabs Logic - Chips */}
                  {status !== 'success' && (
                     <div className="flex flex-wrap items-center justify-center sm:justify-end gap-1.5 shrink-0">
                        {[
                           { key: 'individual' as const, label: t('users.modals.unified.tabs.individual', 'Indiv.'), icon: Mail },
                           { key: 'bulk' as const, label: t('users.modals.unified.tabs.bulk', 'Masivo'), icon: Link2 },
                           { key: 'manage' as const, label: t('users.modals.unified.tabs.manage', 'Ver'), icon: List },
                        ].map((tab) => (
                           <button
                              key={tab.key}
                              onClick={() => {
                                 setMode(tab.key);
                                 setError(null);
                                 setStatus('idle');
                              }}
                              className={`p-2 rounded-xl flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all ${mode === tab.key ? 'shadow-lg' : 'opacity-30 grayscale hover:opacity-100 hover:grayscale-0'}`}
                              style={mode === tab.key ? {
                                 backgroundColor: theme.primaryColor,
                                 color: theme.onPrimaryColor,
                              } : {
                                 backgroundColor: theme.inputBg,
                                 color: theme.textColor,
                              }}
                           >
                              <tab.icon className="w-3.5 h-3.5" />
                              <span className="hidden xs:inline">{tab.label}</span>
                           </button>
                        ))}
                     </div>
                  )}

                  <button 
                     onClick={onClose} 
                     className="p-2.5 rounded-xl transition-all border shrink-0"
                     style={{
                        backgroundColor: theme.inputBg,
                        borderColor: theme.borderColor,
                        color: theme.mutedText,
                     }}
                  >
                     <X className="w-4 h-4" />
                  </button>
               </div>
            </div>

            {/* 2. Scrollable Body Content */}
            <div className="flex-1 overflow-hidden relative">
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
