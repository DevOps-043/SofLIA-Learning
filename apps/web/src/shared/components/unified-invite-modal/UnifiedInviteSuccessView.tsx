'use client';

import { motion } from 'framer-motion';
import {
  Calendar,
  Check,
  CheckCircle,
  Copy,
  Shield,
  Users,
  ChevronRight,
  Sparkles,
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

  const footerBg = theme.isDark ? '#0b0e14' : '#FFFFFF';

  if (mode === 'individual') {
    return (
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col h-full overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
      >
        <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center pb-24 sm:pb-32">
          <motion.div
            animate={{ scale: 1, rotate: 0 }}
            className="w-24 h-24 sm:w-32 sm:h-32 rounded-[2.5rem] flex items-center justify-center mb-8 relative"
            initial={{ scale: 0, rotate: -20 }}
            style={{ 
               background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
               boxShadow: `0 32px 64px -12px ${theme.primaryColor}50`
            }}
            transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
          >
            <Check className="w-12 h-12 sm:w-16 sm:h-16 text-white" strokeWidth={3} />
            <motion.div 
               animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
               className="absolute -top-4 -right-4 w-12 h-12 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20"
               transition={{ duration: 4, repeat: Infinity }}
            >
               <Sparkles className="w-6 h-6 text-white" />
            </motion.div>
          </motion.div>

          <h4 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mb-3" style={{ color: theme.textColor }}>
            {t('users.modals.invite.success.title', '¡Invitación enviada!')}
          </h4>
          <p className="text-[11px] sm:text-xs font-black uppercase tracking-[0.2em] opacity-40 max-w-sm leading-relaxed" style={{ color: theme.mutedText }}>
            {t('users.modals.invite.success.message', 'Hemos enviado los detalles del acceso correctamente a:')}
          </p>
          <div className="mt-6 px-6 py-3 rounded-2xl border bg-black/5" style={{ borderColor: theme.borderColor }}>
             <span className="text-sm font-black tracking-wide" style={{ color: theme.primaryColor }}>{successEmail}</span>
          </div>
        </div>

        {/* Footer */}
        <div 
           className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 lg:px-12 flex items-center justify-end gap-4 border-t"
           style={{ backgroundColor: footerBg, borderColor: theme.borderColor }}
        >
          <button
             className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border w-full sm:w-auto"
             onClick={onClose}
             style={{ backgroundColor: theme.primaryColor, color: theme.isDark ? '#000000' : '#FFFFFF' }}
          >
             {t('users.buttons.done', 'Listo')}
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
    >
      <div className="flex-1 overflow-y-auto pt-6 sm:pt-8 pb-24 sm:pb-32 px-6 lg:px-12 space-y-8">
        <div className="text-center flex flex-col items-center">
          <motion.div
            animate={{ scale: 1 }}
            className="w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl border-4"
            initial={{ scale: 0 }}
            style={{ 
               background: `linear-gradient(135deg, ${theme.primaryColor}20, ${theme.accentColor}10)`,
               borderColor: theme.borderColor,
               color: theme.primaryColor
            }}
            transition={{ delay: 0.1, stiffness: 200, type: 'spring' }}
          >
            <CheckCircle className="w-10 h-10" strokeWidth={2.5} />
          </motion.div>
          <h4 className="text-2xl font-black uppercase tracking-tight mb-2" style={{ color: theme.textColor }}>
            {t('users.modals.bulkInvite.success.title', 'Enlace preparado')}
          </h4>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-40 max-w-xs" style={{ color: theme.mutedText }}>
            {t('users.modals.bulkInvite.success.subtitle', 'Comparte el enlace con tu equipo para que puedan registrarse.')}
          </p>
        </div>

        {/* Copy Link UI */}
        <div
          className="p-3 pr-2 rounded-[2rem] border bg-transparent flex items-center gap-4 transition-all hover:shadow-2xl"
          style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}
        >
          <div className="flex-1 min-w-0 pl-4 py-2">
            <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1" style={{ color: theme.mutedText }}>
              {t('users.modals.bulkInvite.success.linkLabel', 'Enlace de invitación')}
            </p>
            <p className="text-xs font-mono font-bold truncate pr-4" style={{ color: theme.textColor }}>
              {getInviteUrl()}
            </p>
          </div>
          <button
            className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all shrink-0 shadow-lg border"
            onClick={() => void handleCopy()}
            style={{
              backgroundColor: copied ? theme.primaryColor : theme.menuBg,
              color: copied ? (theme.isDark ? '#000000' : '#FFFFFF') : theme.textColor,
              borderColor: theme.borderColor
            }}
          >
            {copied ? <Check className="w-6 h-6" strokeWidth={3} /> : <Copy className="w-5 h-5 opacity-40" />}
          </button>
        </div>

        {createdLink && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              className="p-5 rounded-[1.8rem] text-center border shadow-sm"
              style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}
            >
              <Users className="w-5 h-5 mx-auto mb-2 opacity-20" style={{ color: theme.textColor }} />
              <p className="text-xl font-black mb-0.5" style={{ color: theme.textColor }}>{createdLink.max_uses}</p>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-40" style={{ color: theme.mutedText }}>{t('users.modals.bulkInvite.success.maxUsers', 'Registros')}</p>
            </div>
            
            <div
              className="p-5 rounded-[1.8rem] text-center border shadow-sm"
              style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}
            >
              <Shield className="w-5 h-5 mx-auto mb-2 opacity-20" style={{ color: theme.textColor }} />
              <p className="text-xl font-black mb-0.5 uppercase" style={{ color: theme.textColor }}>
                {roleLabels[createdLink.role as keyof typeof roleLabels]?.label || createdLink.role}
              </p>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-40" style={{ color: theme.mutedText }}>{t('users.modals.bulkInvite.success.role', 'Rol')}</p>
            </div>

            <div
              className="p-5 rounded-[1.8rem] text-center border shadow-sm"
              style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}
            >
              <Calendar className="w-5 h-5 mx-auto mb-2 opacity-20" style={{ color: theme.textColor }} />
              <p className="text-xl font-black mb-0.5" style={{ color: theme.textColor }}>
                {new Date(createdLink.expires_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
              </p>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-40" style={{ color: theme.mutedText }}>{t('users.modals.bulkInvite.success.expires', 'Vencimiento')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div 
         className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 lg:px-12 flex items-center justify-between gap-4 border-t"
         style={{ backgroundColor: footerBg, borderColor: theme.borderColor }}
      >
        <button
           className="px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border"
           onClick={handleCreateAnother}
           style={{ color: theme.mutedText, backgroundColor: theme.inputBg, borderColor: theme.borderColor }}
        >
           {t('users.buttons.createAnother', 'Crear otro')}
        </button>
        <button
           className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border shadow-2xl flex items-center gap-3"
           onClick={onClose}
           style={{ backgroundColor: theme.primaryColor, color: theme.isDark ? '#000000' : '#FFFFFF' }}
        >
           <span>{t('users.buttons.done', 'Finalizar')}</span>
           <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
