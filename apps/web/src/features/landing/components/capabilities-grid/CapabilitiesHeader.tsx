import { motion } from 'framer-motion';
import type { TFunction } from 'i18next';

interface CapabilitiesHeaderProps {
  isInView: boolean;
  t: TFunction<'common'>;
}

export function CapabilitiesHeader({ isInView, t }: CapabilitiesHeaderProps) {
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
        className="mb-6 inline-block rounded-full bg-accent/10 px-4 py-2 text-sm font-medium text-accent"
      >
        {t('landing.capabilities.tag', 'Capacidades')}
      </motion.span>

      <h2 className="mb-6 text-3xl font-bold text-primary dark:text-white lg:text-5xl">
        {t('landing.capabilities.title', 'Todo lo que necesitas para capacitar a tu equipo')}
      </h2>

      <p className="mx-auto max-w-3xl text-lg text-gray-600 dark:text-white/60 lg:text-xl">
        {t(
          'landing.capabilities.subtitle',
          'Cada funcionalidad esta disenada para generar impacto medible en tu organizacion'
        )}
      </p>
    </motion.div>
  );
}
