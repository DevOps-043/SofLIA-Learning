import { motion } from 'framer-motion';
import { SocialLoginButtons } from '../SocialLoginButtons';

type Translate = (key: string) => string;

interface RegisterFooterProps {
  t: Translate;
  onLoginClick: () => void;
}

export function RegisterFooter({ t, onLoginClick }: RegisterFooterProps) {
  return (
    <>
      <motion.div data-auth-social initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.4 }} className="mt-5">
        <SocialLoginButtons showLoginLink={false} />
      </motion.div>
      <motion.div data-auth-switch initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75, duration: 0.4 }} className="mt-5 text-center">
        <p className="text-xs sm:text-sm text-gray-500 dark:text-white/60">
          {t('auth.register.hasAccount')}{' '}
          <button
            type="button"
            onClick={onLoginClick}
            className="font-semibold text-accent hover:text-accent/80 dark:text-accent dark:hover:text-accent/70 transition-colors"
          >
            {t('auth.register.loginHere')}
          </button>
        </p>
      </motion.div>
    </>
  );
}
