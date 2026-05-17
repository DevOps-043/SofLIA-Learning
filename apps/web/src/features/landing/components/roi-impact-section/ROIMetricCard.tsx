import { motion } from 'framer-motion';
import type { TFunction } from 'i18next';
import { TrendingDown, TrendingUp } from 'lucide-react';

import { AnimatedCounter } from './AnimatedCounter';
import type { RoiMetric } from './roi-impact.config';

interface ROIMetricCardProps {
  disableHeavy: boolean;
  index: number;
  isInView: boolean;
  metric: RoiMetric;
  t: TFunction<'common'>;
}

export function ROIMetricCard({
  disableHeavy,
  index,
  isInView,
  metric,
  t,
}: ROIMetricCardProps) {
  const Icon = metric.icon;
  const TrendIcon = metric.trend === 'up' ? TrendingUp : TrendingDown;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative rounded-md border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all duration-500 hover:border-white/20 hover:bg-white/10 lg:p-8"
    >
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-md ${metric.iconClassName}`}>
        <Icon size={24} />
      </div>

      <div className="mb-2 flex items-baseline gap-2">
        <span className={`text-4xl font-bold lg:text-5xl ${metric.valueClassName}`}>
          <AnimatedCounter
            target={metric.value}
            prefix={metric.prefix}
            suffix={metric.suffix}
          />
        </span>

        <motion.div
          className="text-success"
          animate={disableHeavy ? {} : { y: metric.trend === 'up' ? [0, -4, 0] : [0, 4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <TrendIcon size={20} />
        </motion.div>
      </div>

      <p className="text-sm text-white/60">
        {t(`landing.roi.metrics.${metric.key}`, metric.key)}
      </p>

      <div className="pointer-events-none absolute inset-0 rounded-md opacity-0 ring-1 ring-inset ring-white/10 transition-opacity duration-500 group-hover:opacity-100" />
    </motion.div>
  );
}
