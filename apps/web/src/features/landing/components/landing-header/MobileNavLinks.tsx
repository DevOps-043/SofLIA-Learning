import { motion } from 'framer-motion';
import Link from 'next/link';
import type { LandingHeaderTranslator, LandingNavLink } from './types';

interface MobileNavLinksProps {
  links: LandingNavLink[];
  t: LandingHeaderTranslator;
  onNavigate: () => void;
}

const mobileLinkClass =
  'rounded-xl px-4 py-3 text-base font-medium text-primary transition-colors hover:bg-gray-100 dark:text-white dark:hover:bg-white/5';

export function MobileNavLinks({ links, t, onNavigate }: MobileNavLinksProps) {
  return (
    <>
      {links.map((link, index) => {
        const label = t(`landing.nav.${link.key}`, link.key);

        if (link.href.startsWith('/')) {
          return (
            <Link key={link.key} href={link.href} onClick={onNavigate} className={mobileLinkClass}>
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {label}
              </motion.span>
            </Link>
          );
        }

        return (
          <motion.a
            key={link.key}
            href={link.href}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={onNavigate}
            className={mobileLinkClass}
          >
            {label}
          </motion.a>
        );
      })}
    </>
  );
}
