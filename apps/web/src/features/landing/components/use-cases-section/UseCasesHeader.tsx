import { motion } from 'framer-motion';
import type { TFunction } from 'i18next';

interface UseCasesHeaderProps {
  isInView: boolean;
  t: TFunction<'common'>;
}

export function UseCasesHeader({ isInView, t }: UseCasesHeaderProps) {
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
        className="mb-6 inline-block rounded-full bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-500"
      >
        {t('landing.useCases.tag', 'Casos de Uso')}
      </motion.span>

      <h2 className="mb-6 text-3xl font-bold text-primary dark:text-white lg:text-5xl">
        {t('landing.useCases.title', 'Casos de uso que impulsan resultados')}
      </h2>

      <p className="mx-auto max-w-3xl text-lg text-gray-600 dark:text-white/60 lg:text-xl">
        {t(
          'landing.useCases.subtitle',
          'Cada solucion esta disenada para resolver desafios especificos de tu organizacion'
        )}
      </p>
    </motion.div>
  );
}
