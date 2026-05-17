import Link from 'next/link';
import type { TFunction } from 'i18next';

import { footerSections } from './footer.config';

interface FooterNavigationProps {
  t: TFunction<'common'>;
}

export function FooterNavigation({ t }: FooterNavigationProps) {
  return (
    <>
      {footerSections.map((section) => (
        <div key={section.titleKey}>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/40">
            {t(`landing.footer.sections.${section.titleKey}`, section.titleKey)}
          </h4>
          <ul className="space-y-3">
            {section.links.map((link) => (
              <li key={link.key}>
                <FooterLink href={link.href}>
                  {t(`landing.footer.links.${link.key}`, link.key)}
                </FooterLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

function FooterLink({ children, href }: { children: string; href: string }) {
  const className = 'text-sm text-white/60 transition-colors duration-200 hover:text-accent';

  return href.startsWith('/') ? (
    <Link href={href} className={className}>
      {children}
    </Link>
  ) : (
    <a href={href} className={className}>
      {children}
    </a>
  );
}
