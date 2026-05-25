import type { ComparisonCategory } from '@aprende-y-aplica/shared';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';

import { AvailabilityIcon } from './AvailabilityIcon';

type ComparisonFeature = ComparisonCategory['features'][number];

interface ComparisonFeatureRowProps {
  categoryIndex: number;
  feature: ComparisonFeature;
  featureIndex: number;
}

export function ComparisonFeatureRow({
  categoryIndex,
  feature,
  featureIndex,
}: ComparisonFeatureRowProps) {
  return (
    <motion.div
      className="grid grid-cols-4 gap-4 p-4 transition-colors hover:bg-glass-light/50"
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: categoryIndex * 0.1 + featureIndex * 0.05 }}
    >
      <div className="flex items-start gap-2">
        <div>
          <div className="font-medium">{feature.name}</div>
          {feature.description && (
            <div className="mt-1 text-sm opacity-70">{feature.description}</div>
          )}
          {feature.notes && (
            <div className="mt-1 flex items-center gap-1 text-xs text-primary">
              <Info className="h-3 w-3" />
              <span>{feature.notes}</span>
            </div>
          )}
        </div>
      </div>

      <AvailabilityIcon available={feature.team} />
      <AvailabilityIcon available={feature.business} />
      <AvailabilityIcon available={feature.enterprise} />
    </motion.div>
  );
}
