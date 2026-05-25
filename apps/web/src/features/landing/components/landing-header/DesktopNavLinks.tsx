import { motion } from 'framer-motion';
import Link from 'next/link';
import type { LandingHeaderTranslator, LandingNavLink } from './types';

interface DesktopNavLinksProps {
  links: LandingNavLink[];
  t: LandingHeaderTranslator;
}

const desktopLinkClass =
  'px-4 py-2 text-sm font-medium text-gray-500 transition-colors rounded-lg hover:bg-gray-100 hover:text-primary dark:text-white/70 dark:hover:bg-white/5 dark:hover:text-white';

export function DesktopNavLinks({ links, t }: DesktopNavLinksProps) {
  return (
    <div className="ml-2 hidden items-center gap-1 lg:flex">
      {links.map((link) => {
        const label = t(`landing.nav.${link.key}`, link.key);

        if (link.href.startsWith('/') && link.href.length > 1) {
          return (
            <Link key={link.key} href={link.href} className={desktopLinkClass}>
              <motion.span whileHover={{ scale: 1.02 }}>{label}</motion.span>
            </Link>
          );
        }

        return (
          <motion.a key={link.key} href={link.href} whileHover={{ scale: 1.02 }} className={desktopLinkClass}>
            {label}
          </motion.a>
        );
      })}

      <Link href="/downloads">
        <motion.span
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="inline-block cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/10 hover:text-accent"
        >
          {t('landing.nav.downloadHub', 'Descargar Hub')}
        </motion.span>
      </Link>
    </div>
  );
}
