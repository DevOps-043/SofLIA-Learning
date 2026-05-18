import { Sparkles } from 'lucide-react';
import type { BusinessInviteTheme, BusinessInviteTranslator } from './types';

interface InviteInfoNoteProps {
  t: BusinessInviteTranslator;
  theme: BusinessInviteTheme;
}

export function InviteInfoNote({ t, theme }: InviteInfoNoteProps) {
  return (
    <div className="p-4 rounded-xl border" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}>
      <div className="flex items-start gap-3">
        <Sparkles className="w-5 h-5 flex-shrink-0" style={{ color: theme.accentColor }} />
        <div className="text-sm" style={{ color: theme.mutedTextColor }}>
          <p>{t('users.modals.invite.hints.info', 'El usuario recibira un correo con un enlace para completar su registro. La invitacion expira en 7 dias.')}</p>
        </div>
      </div>
    </div>
  );
}
