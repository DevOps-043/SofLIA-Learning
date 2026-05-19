import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import type { BusinessInviteTheme } from './types';

interface InviteErrorMessageProps {
  error: string | null;
  theme: BusinessInviteTheme;
}

export function InviteErrorMessage({ error, theme }: InviteErrorMessageProps) {
  if (!error) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl border flex items-center gap-3"
      style={{ backgroundColor: `color-mix(in srgb, ${theme.dangerColor} 6.3%, transparent)`, borderColor: `color-mix(in srgb, ${theme.dangerColor} 12.5%, transparent)` }}
    >
      <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: theme.dangerColor }} />
      <span className="text-sm flex-1" style={{ color: theme.dangerColor }}>{error}</span>
    </motion.div>
  );
}
