import Link from 'next/link';
import type { LandingHeaderTranslator, LandingNavLink } from './types';

interface DesktopNavLinksProps {
  links: LandingNavLink[];
  t: LandingHeaderTranslator;
}

const desktopLinkClass =
  'px-4 py-2 text-sm font-medium text-gray-500 transition-all duration-150 rounded-lg hover:bg-gray-100 hover:text-primary hover:scale-[1.02] dark:text-white/70 dark:hover:bg-white/5 dark:hover:text-white';

export function DesktopNavLinks({ links, t }: DesktopNavLinksProps) {
  return (
    <div className="ml-2 hidden items-center gap-1 lg:flex">
      {links.map((link) => {
        const label = t(`landing.nav.${link.key}`, link.key);

        if (link.href.startsWith('/') && link.href.length > 1) {
          return (
            <Link key={link.key} href={link.href} className={desktopLinkClass}>
              {label}
            </Link>
          );
        }

        return (
          <a key={link.key} href={link.href} className={desktopLinkClass}>
            {label}
          </a>
        );
      })}

      <Link
        href="/downloads"
        className="inline-block cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-accent transition-all duration-150 hover:bg-accent/10 hover:text-accent hover:scale-[1.03] active:scale-[0.97]"
      >
        {t('landing.nav.downloadHub', 'Descargar Hub')}
      </Link>
    </div>
  );
}
