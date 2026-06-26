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
        const entryStyle = { animationDelay: `${index * 50}ms` };

        if (link.href.startsWith('/')) {
          return (
            <Link key={link.key} href={link.href} onClick={onNavigate} className={mobileLinkClass}>
              <span className="animate-slide-in-left block" style={entryStyle}>
                {label}
              </span>
            </Link>
          );
        }

        return (
          <a
            key={link.key}
            href={link.href}
            onClick={onNavigate}
            className={`${mobileLinkClass} animate-slide-in-left`}
            style={entryStyle}
          >
            {label}
          </a>
        );
      })}
    </>
  );
}
