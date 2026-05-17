import { motion } from 'framer-motion';
import type { TFunction } from 'i18next';
import { CheckCircle2 } from 'lucide-react';

import type { SecurityFeature } from './security.config';
import { securityItemVariants } from './security.motion';

interface SecurityFeatureCardProps {
  feature: SecurityFeature;
  t: TFunction<'common'>;
}

export function SecurityFeatureCard({ feature, t }: SecurityFeatureCardProps) {
  const Icon = feature.icon;

  return (
    <motion.div
      variants={securityItemVariants}
      whileHover={{ y: -4 }}
      className="group rounded-md border border-gray-200 bg-white p-6 transition-all duration-300 hover:border-accent/50 hover:shadow-xl hover:shadow-black/5 dark:border-white/10 dark:bg-gray-800 dark:hover:shadow-black/20 lg:p-8"
    >
      <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-md ${feature.iconClassName}`}>
        <Icon size={28} />
      </div>

      <h3 className="mb-3 text-lg font-bold text-primary dark:text-white">
        {t(`landing.security.features.${feature.key}.title`, feature.key)}
      </h3>
      <p className="mb-4 text-sm text-gray-600 dark:text-white/60">
        {t(`landing.security.features.${feature.key}.description`, '')}
      </p>

      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-gray-600 dark:text-white/50">
            <CheckCircle2 size={14} className="flex-shrink-0 text-success" />
            <span>{t(`landing.security.features.${feature.key}.check${i}`, '')}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
