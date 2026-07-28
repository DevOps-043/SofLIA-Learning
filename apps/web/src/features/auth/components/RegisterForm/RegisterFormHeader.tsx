import { motion } from 'framer-motion';

type Translate = (key: string) => string;

export function RegisterFormHeader({ t }: { t: Translate }) {
  return (
    <motion.div
      data-auth-header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
      className="text-center mb-5"
    >
      <h1 className="text-2xl sm:text-3xl font-bold text-primary dark:text-white mb-1">
        {t('auth.register.title')}
      </h1>
      <p className="text-xs sm:text-sm text-gray-500 dark:text-white/60">
        {t('auth.register.subtitle')}
      </p>
    </motion.div>
  );
}
