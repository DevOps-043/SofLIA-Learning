import { motion } from 'framer-motion';
import type { TFunction } from 'i18next';

import type { TrustBadge } from './trust.config';
import { trustItemVariants } from './trust.motion';

interface TrustBadgeCardProps {
  badge: TrustBadge;
  t: TFunction<'common'>;
}

export function TrustBadgeCard({ badge, t }: TrustBadgeCardProps) {
  const Icon = badge.icon;

  return (
    <motion.div
      variants={trustItemVariants}
      whileHover={{ y: -4, scale: 1.02 }}
      className="group relative rounded-md border border-gray-200 bg-gray-100/30 p-6 transition-all duration-300 hover:border-accent/50 dark:border-white/10 dark:bg-white/5"
    >
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-md transition-transform duration-300 group-hover:scale-110 ${badge.iconClassName}`}>
        <Icon size={24} />
      </div>

      <h3 className="mb-1 text-sm font-semibold text-primary dark:text-white">
        {t(`landing.trust.badges.${badge.key}.title`, badge.key)}
      </h3>
      <p className="text-xs text-gray-600 dark:text-white/50">
        {t(`landing.trust.badges.${badge.key}.description`, '')}
      </p>
    </motion.div>
  );
}
