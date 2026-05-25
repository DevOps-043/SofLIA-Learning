import { motion } from 'framer-motion';

import { staggerItem } from '../../../../../shared/utils/animations';
import type { IntegrationItem } from './integrations.config';

interface IntegrationCardProps {
  integration: IntegrationItem;
}

export function IntegrationCard({ integration }: IntegrationCardProps) {
  const Icon = integration.icon;

  return (
    <motion.div
      variants={staggerItem}
      className="group cursor-pointer"
      whileHover={{ y: -8 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="relative overflow-hidden rounded-md border border-glass-light bg-glass p-8 transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10">
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:translate-x-full group-hover:opacity-100" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <motion.div
            className="flex h-16 w-16 items-center justify-center rounded-md bg-gradient-to-br from-primary/10 to-success/10 transition-all duration-300 group-hover:from-primary/20 group-hover:to-success/20"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Icon className="h-8 w-8 text-primary" />
          </motion.div>
          <span className="text-center text-sm font-semibold">{integration.name}</span>
        </div>
      </div>
    </motion.div>
  );
}
