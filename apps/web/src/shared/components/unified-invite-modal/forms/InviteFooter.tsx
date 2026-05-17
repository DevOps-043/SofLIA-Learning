import { motion } from 'framer-motion';
import { ChevronRight, Link2, Send } from 'lucide-react';
import type { ModalStatus, UnifiedInviteModalController, UnifiedInviteTheme } from '../types';

interface InviteFooterProps {
  icon: 'link' | 'send';
  loadingLabel: string;
  modeLabel: string;
  onClose: () => void;
  status: ModalStatus;
  submitLabel: string;
  t: UnifiedInviteModalController['t'];
  theme: UnifiedInviteTheme;
}

export function InviteFooter({ icon, loadingLabel, modeLabel, onClose, status, submitLabel, t, theme }: InviteFooterProps) {
  const Icon = icon === 'link' ? Link2 : Send;

  return (
    <div className="flex shrink-0 items-center justify-between gap-4 border-t p-4 sm:p-5 lg:px-8" style={{ backgroundColor: theme.surfaceColor, borderColor: theme.borderColor }}>
      <div className="hidden select-none items-center gap-2 opacity-30 sm:flex">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5">
          <Icon className="h-3.5 w-3.5" style={{ color: theme.textColor }} />
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: theme.textColor }}>{modeLabel}</span>
      </div>
      <div className="flex w-full items-center gap-3 sm:w-auto">
        <button className="flex-1 rounded-xl border px-5 py-3 text-[9px] font-black uppercase tracking-widest transition-all sm:flex-none" disabled={status === 'loading'} onClick={onClose} style={{ color: theme.mutedText, backgroundColor: theme.inputBg, borderColor: theme.borderColor }} type="button">
          {t('users.buttons.cancel', 'Cancelar')}
        </button>
        <motion.button className="flex flex-[2] items-center justify-center gap-3 rounded-xl px-6 py-3 text-[9px] font-black uppercase tracking-widest shadow-lg disabled:opacity-50 sm:flex-none" disabled={status === 'loading'} style={{ backgroundColor: theme.primaryColor, color: theme.onPrimaryColor }} type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          {status === 'loading' ? <LoadingLabel label={loadingLabel} theme={theme} /> : <SubmitLabel label={submitLabel} />}
        </motion.button>
      </div>
    </div>
  );
}

function LoadingLabel({ label, theme }: { label: string; theme: UnifiedInviteTheme }) {
  return (
    <>
      <div className={`h-4 w-4 animate-spin rounded-full border-2 ${theme.isDark ? 'border-black/30 border-t-black' : 'border-white/30 border-t-white'}`} />
      <span>{label}</span>
    </>
  );
}

function SubmitLabel({ label }: { label: string }) {
  return (
    <>
      <span>{label}</span>
      <ChevronRight className="h-4 w-4" />
    </>
  );
}
