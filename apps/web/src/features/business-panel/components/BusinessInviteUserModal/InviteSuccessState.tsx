import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import type { BusinessInviteTheme, BusinessInviteTranslator } from './types';

interface InviteSuccessStateProps {
  message: string | null;
  t: BusinessInviteTranslator;
  theme: BusinessInviteTheme;
}

export function InviteSuccessState({ message, t, theme }: InviteSuccessStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 flex flex-col items-center justify-center text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
        className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: `color-mix(in srgb, ${theme.accentColor} 12.5%, transparent)` }}
      >
        <CheckCircle className="w-10 h-10" style={{ color: theme.accentColor }} />
      </motion.div>
      <h4 className="text-xl font-bold mb-2" style={{ color: theme.textColor }}>
        {t('users.modals.invite.success.title', 'Invitacion enviada')}
      </h4>
      <p style={{ color: theme.mutedTextColor }}>{message}</p>
    </motion.div>
  );
}
