import { motion } from 'framer-motion';
import type { TFunction } from 'i18next';

import type { CapabilityItem } from './capabilities.config';
import { capabilityCardVariants } from './capabilities.motion';

interface CapabilityCardProps {
  capability: CapabilityItem;
  t: TFunction<'common'>;
}

export function CapabilityCard({ capability, t }: CapabilityCardProps) {
  const Icon = capability.icon;

  return (
    <motion.div
      variants={capabilityCardVariants}
      whileHover={{ y: -4 }}
      className="group relative rounded-md border border-gray-200 bg-white p-6 transition-all duration-300 hover:border-accent/30 hover:shadow-xl dark:border-white/10 dark:bg-gray-800 lg:p-8"
    >
      <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-md ${capability.iconClassName}`}>
        <Icon size={28} />
      </div>

      <h3 className="mb-2 text-lg font-bold text-primary dark:text-white">
        {t(`landing.capabilities.items.${capability.key}.title`, capability.key)}
      </h3>

      <p className="mb-3 text-sm text-gray-600 dark:text-white/60">
        {t(`landing.capabilities.items.${capability.key}.benefit`, '')}
      </p>

      <p className="text-xs font-medium text-accent">
        {t(`landing.capabilities.items.${capability.key}.result`, '')}
      </p>
    </motion.div>
  );
}
