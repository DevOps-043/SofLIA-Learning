import { motion } from 'framer-motion';
import type { TFunction } from 'i18next';

import { trustStats } from './trust.config';

interface TrustStatsProps {
  t: TFunction<'common'>;
}

export function TrustStats({ t }: TrustStatsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="mt-12 flex flex-wrap items-center justify-center gap-8 lg:mt-16 lg:gap-16"
    >
      {trustStats.map((stat) => (
        <div key={stat.key} className="text-center">
          <p className="text-3xl font-bold text-accent lg:text-4xl">{stat.value}</p>
          <p className="text-sm text-gray-600 dark:text-white/50">
            {t(`landing.trust.stats.${stat.key}`, stat.key)}
          </p>
        </div>
      ))}
    </motion.div>
  );
}
