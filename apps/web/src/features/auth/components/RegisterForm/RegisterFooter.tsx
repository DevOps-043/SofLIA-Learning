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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.4 }} className="mt-5">
        <SocialLoginButtons showLoginLink={false} />
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75, duration: 0.4 }} className="mt-5 text-center">
        <p className="text-xs sm:text-sm text-[#6C757D] dark:text-white/60">
          {t('auth.register.hasAccount')}{' '}
          <button
            type="button"
            onClick={onLoginClick}
            className="font-semibold text-[#00D4B3] hover:text-[#00D4B3]/80 dark:text-[#00D4B3] dark:hover:text-[#00D4B3]/70 transition-colors"
          >
            {t('auth.register.loginHere')}
          </button>
        </p>
      </motion.div>
    </>
  );
}
