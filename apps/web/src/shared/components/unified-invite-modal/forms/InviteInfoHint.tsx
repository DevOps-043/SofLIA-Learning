import { Sparkles } from 'lucide-react';
import type { UnifiedInviteTheme } from '../types';

export function InviteInfoHint({ message, theme }: { message: string; theme: UnifiedInviteTheme }) {
  return (
    <div className="rounded-[1.5rem] border bg-transparent p-4" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}>
      <div className="flex items-center gap-4">
        <Sparkles className="h-5 w-5 shrink-0" style={{ color: theme.accentColor }} />
        <p className="text-[9px] font-black uppercase leading-relaxed tracking-widest opacity-60 sm:text-[10px]" style={{ color: theme.mutedText }}>
          {message}
        </p>
      </div>
    </div>
  );
}
