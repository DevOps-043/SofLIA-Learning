import Link from 'next/link';
import { warmClientAccess } from './prefetch-auth';
import type { LandingHeaderTranslator } from './types';

interface MobileActionsProps {
  t: LandingHeaderTranslator;
  onNavigate: () => void;
}

export function MobileActions({ t, onNavigate }: MobileActionsProps) {
  return (
    <>
      <Link
        href="/auth"
        prefetch
        onPointerDown={warmClientAccess}
        onFocus={warmClientAccess}
        className="rounded-xl px-4 py-3 text-base font-medium text-gray-500 transition-colors hover:bg-gray-100 dark:text-white/70 dark:hover:bg-white/5 [&[data-navigating]]:cursor-wait [&[data-navigating]]:opacity-60"
        onClick={(e) => {
          ;(e.currentTarget as HTMLElement).dataset.navigating = 'true'
          onNavigate()
        }}
      >
        {t('landing.nav.clientAccess', 'Acceso clientes')}
      </Link>
      <Link
        href="/downloads"
        onClick={onNavigate}
        className="rounded-xl px-4 py-3 text-base font-medium text-accent transition-colors hover:bg-accent/10"
      >
        {t('landing.nav.downloadHub', 'Descargar Hub')}
      </Link>
      <Link href="/contact" onClick={onNavigate}>
        <span className="block w-full cursor-pointer rounded-xl bg-primary px-4 py-3 text-center text-base font-medium text-white shadow-lg transition-transform active:scale-[0.98]">
          {t('landing.nav.scheduleDemo', 'Agendar demo')}
        </span>
      </Link>
    </>
  );
}
