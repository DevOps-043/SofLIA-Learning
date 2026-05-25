import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import type { BusinessInviteTheme, BusinessInviteTranslator, InviteStatus } from './types';

interface InviteFormFooterProps {
  onClose: () => void;
  status: InviteStatus;
  t: BusinessInviteTranslator;
  theme: BusinessInviteTheme;
}

export function InviteFormFooter({ onClose, status, t, theme }: InviteFormFooterProps) {
  return (
    <div className="p-6 border-t flex items-center justify-end gap-3 shrink-0" style={{ borderColor: theme.borderColor }}>
      <button
        type="button"
        onClick={onClose}
        disabled={status === 'loading'}
        className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
        style={{ color: theme.mutedTextColor, backgroundColor: theme.inputBg }}
      >
        {t('users.buttons.cancel', 'Cancelar')}
      </button>
      <motion.button
        type="submit"
        whileHover={{ scale: status === 'loading' ? 1 : 1.02 }}
        whileTap={{ scale: status === 'loading' ? 1 : 0.98 }}
        disabled={status === 'loading'}
        className="px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-70"
        style={{
          backgroundColor: theme.primaryColor,
          boxShadow: `0 4px 15px color-mix(in srgb, ${theme.primaryColor} 25.1%, transparent)`,
          color: theme.onPrimaryColor
        }}
      >
        {status === 'loading' ? (
          <>
            <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: `color-mix(in srgb, ${theme.onPrimaryColor} 30.2%, transparent)`, borderTopColor: theme.onPrimaryColor }} />
            <span>{t('users.buttons.sending', 'Enviando...')}</span>
          </>
        ) : (
          <>
            <Send className="w-4 h-4" strokeWidth={2} />
            <span>{t('users.buttons.sendInvite', 'Enviar Invitacion')}</span>
          </>
        )}
      </motion.button>
    </div>
  );
}
