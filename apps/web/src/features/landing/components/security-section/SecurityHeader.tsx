import { motion } from 'framer-motion';
import type { TFunction } from 'i18next';

interface SecurityHeaderProps {
  isInView: boolean;
  t: TFunction<'common'>;
}

export function SecurityHeader({ isInView, t }: SecurityHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="mb-16 text-center lg:mb-20"
    >
      <motion.span
        initial={{ opacity: 0, scale: 0.9 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-6 inline-block rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary dark:bg-white/10 dark:text-white"
      >
        {t('landing.security.tag', 'Seguridad Enterprise')}
      </motion.span>

      <h2 className="mb-6 text-3xl font-bold text-primary dark:text-white lg:text-5xl">
        {t('landing.security.title', 'Gobierno y control que tu organizacion necesita')}
      </h2>

      <p className="mx-auto max-w-3xl text-lg text-gray-600 dark:text-white/60 lg:text-xl">
        {t(
          'landing.security.subtitle',
          'Disenada para cumplir con los estandares de seguridad y trazabilidad mas exigentes'
        )}
      </p>
    </motion.div>
  );
}
