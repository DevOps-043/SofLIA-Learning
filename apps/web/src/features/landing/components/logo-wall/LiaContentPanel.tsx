import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { liaFeatures } from './lia-features.config';
import { LiaFeatureCard } from './LiaFeatureCard';

export function LiaContentPanel() {
  const { t } = useTranslation('common');

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="text-center lg:text-left"
    >
      <div className="mb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 dark:bg-accent/20"
        >
          <Brain size={16} className="text-accent" />
          <span className="text-sm font-medium text-accent">
            {t('landing.lia.tag', 'Tu asistente personal')}
          </span>
        </motion.div>

        <h2 className="mb-4 text-3xl font-bold text-primary dark:text-white lg:text-4xl xl:text-5xl">
          {t('landing.lia.title', 'Conoce a')} <span className="text-accent">SofLIA</span>
        </h2>
        <p className="mx-auto max-w-lg text-lg text-gray-600 dark:text-white/70 lg:mx-0">
          {t(
            'landing.lia.description',
            'Tu asistente de aprendizaje con inteligencia artificial que te guia, responde tus dudas y personaliza tu experiencia de capacitacion en tiempo real.'
          )}
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
        {liaFeatures.map((feature, index) => (
          <LiaFeatureCard key={feature.titleKey} feature={feature} index={index} t={t} />
        ))}
      </div>
    </motion.div>
  );
}
