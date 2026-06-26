import { LANDING_NAV_LINKS } from './constants';
import { MobileActions } from './MobileActions';
import { MobileNavLinks } from './MobileNavLinks';
import { MobilePreferences } from './MobilePreferences';
import type { LandingHeaderState, LandingHeaderTranslator } from './types';

interface MobileMenuProps {
  state: LandingHeaderState;
  t: LandingHeaderTranslator;
}

export function MobileMenu({ state, t }: MobileMenuProps) {
  const closeMenu = () => state.setIsMobileMenuOpen(false);
  const isOpen = state.isMobileMenuOpen;

  return (
    // CSS grid trick: grid-template-rows 0fr -> 1fr animates height without
    // needing JS or AnimatePresence. The inner overflow-hidden clips the content
    // at 0fr. This replaces framer-motion AnimatePresence + motion.div.
    <div
      className="lg:hidden"
      style={{
        display: 'grid',
        gridTemplateRows: isOpen ? '1fr' : '0fr',
        opacity: isOpen ? 1 : 0,
        transition:
          'grid-template-rows 0.3s cubic-bezier(0.16,1,0.3,1), opacity 0.3s cubic-bezier(0.16,1,0.3,1)',
      }}
      aria-hidden={!isOpen}
    >
      <div className="overflow-hidden">
        <div className="border-t border-gray-200 bg-white dark:border-white/10 dark:bg-carbon-900">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col gap-2">
              <MobileNavLinks links={LANDING_NAV_LINKS} t={t} onNavigate={closeMenu} />
              <div className="my-2 h-px bg-gray-200 dark:bg-white/10" />
              <MobilePreferences state={state} />
              <div className="my-2 h-px bg-gray-200 dark:bg-white/10" />
              <MobileActions t={t} onNavigate={closeMenu} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
