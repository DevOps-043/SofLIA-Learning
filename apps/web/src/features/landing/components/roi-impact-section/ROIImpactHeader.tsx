import { motion } from 'framer-motion';
import type { TFunction } from 'i18next';

interface ROIImpactHeaderProps {
  isInView: boolean;
  t: TFunction<'common'>;
}

export function ROIImpactHeader({ isInView, t }: ROIImpactHeaderProps) {
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
        className="mb-6 inline-block rounded-full bg-accent/20 px-4 py-2 text-sm font-medium text-accent"
      >
        {t('landing.roi.tag', 'Impacto Medible')}
      </motion.span>

      <h2 className="mb-6 text-3xl font-bold text-white lg:text-5xl">
        {t('landing.roi.title', 'ROI que habla por si mismo')}
      </h2>

      <p className="mx-auto max-w-3xl text-lg text-white/60 lg:text-xl">
        {t(
          'landing.roi.subtitle',
          'Resultados reales de organizaciones que transformaron su capacitacion con SofLIA'
        )}
      </p>
    </motion.div>
  );
}
