import { AnimatePresence, motion } from 'framer-motion';
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

  return (
    <AnimatePresence>
      {state.isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="border-t border-gray-200 bg-white dark:border-white/10 dark:bg-carbon-900 lg:hidden"
        >
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col gap-2">
              <MobileNavLinks links={LANDING_NAV_LINKS} t={t} onNavigate={closeMenu} />
              <div className="my-2 h-px bg-gray-200 dark:bg-white/10" />
              <MobilePreferences state={state} />
              <div className="my-2 h-px bg-gray-200 dark:bg-white/10" />
              <MobileActions t={t} onNavigate={closeMenu} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
