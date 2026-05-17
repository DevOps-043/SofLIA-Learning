import { motion } from 'framer-motion';
import { Mail, X } from 'lucide-react';
import type { BusinessInviteTheme } from './types';

interface InviteModalHeaderProps {
  onClose: () => void;
  t: (key: string, fallback?: string) => string;
  theme: BusinessInviteTheme;
}

export function InviteModalHeader({ onClose, t, theme }: InviteModalHeaderProps) {
  return (
    <div
      className="p-6 border-b"
      style={{
        background: `linear-gradient(135deg, ${theme.primaryColor}20, ${theme.accentColor}10)`,
        borderColor: theme.borderColor
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="p-2 rounded-xl"
            style={{ backgroundColor: `${theme.accentColor}20` }}
          >
            <Mail className="w-6 h-6" style={{ color: theme.accentColor }} />
          </motion.div>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: theme.textColor }}>
              {t('users.modals.invite.title', 'Invitar Usuario')}
            </h3>
            <p className="text-sm" style={{ color: theme.mutedTextColor }}>
              {t('users.modals.invite.subtitle', 'Envia una invitacion por correo electronico')}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg transition-colors">
          <X className="w-5 h-5" style={{ color: theme.mutedTextColor }} />
        </button>
      </div>
    </div>
  );
}
