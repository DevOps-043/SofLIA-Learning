import { motion } from 'framer-motion';
import type { TFunction } from 'i18next';

import type { LiaFeature } from './lia-features.config';

interface LiaFeatureCardProps {
  feature: LiaFeature;
  index: number;
  t: TFunction<'common'>;
}

export function LiaFeatureCard({ feature, index, t }: LiaFeatureCardProps) {
  const Icon = feature.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.3 + index * 0.1 }}
      whileHover={{ scale: 1.03, y: -2 }}
      className="rounded-md border border-gray-200 bg-white p-4 transition-all duration-300 hover:border-accent/30 hover:shadow-lg dark:border-white/10 dark:bg-white/5"
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-accent/10">
        <Icon size={20} className="text-accent" />
      </div>
      <h4 className="mb-1 text-sm font-semibold text-primary dark:text-white">
        {t(`landing.lia.features.${feature.titleKey}`, feature.titleKey)}
      </h4>
      <p className="text-xs text-gray-600 dark:text-white/60">
        {t(`landing.lia.features.${feature.descKey}`, feature.descKey)}
      </p>
    </motion.div>
  );
}
