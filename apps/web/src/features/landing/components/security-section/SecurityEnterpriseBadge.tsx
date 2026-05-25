import { motion } from 'framer-motion';
import type { TFunction } from 'i18next';
import { Shield } from 'lucide-react';

interface SecurityEnterpriseBadgeProps {
  isInView: boolean;
  t: TFunction<'common'>;
}

export function SecurityEnterpriseBadge({ isInView, t }: SecurityEnterpriseBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="mt-12 flex justify-center lg:mt-16"
    >
      <div className="inline-flex items-center gap-3 rounded-full border border-gray-200 bg-white px-6 py-3 shadow-lg dark:border-white/10 dark:bg-gray-800">
        <Shield className="text-accent" size={24} />
        <span className="text-sm font-medium text-primary dark:text-white">
          {t('landing.security.badge', 'Enterprise-ready desde el dia uno')}
        </span>
      </div>
    </motion.div>
  );
}
