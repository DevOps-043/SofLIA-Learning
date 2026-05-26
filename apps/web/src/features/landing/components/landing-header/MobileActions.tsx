import { motion } from 'framer-motion';
import Link from 'next/link';
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
        onClick={onNavigate}
        className="rounded-xl px-4 py-3 text-base font-medium text-gray-500 transition-colors hover:bg-gray-100 dark:text-white/70 dark:hover:bg-white/5"
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
        <motion.span
          whileTap={{ scale: 0.98 }}
          className="block w-full cursor-pointer rounded-xl bg-primary px-4 py-3 text-center text-base font-medium text-white shadow-lg"
        >
          {t('landing.nav.scheduleDemo', 'Agendar demo')}
        </motion.span>
      </Link>
    </>
  );
}
