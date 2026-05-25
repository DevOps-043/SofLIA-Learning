import { motion } from 'framer-motion';
import {
  COURSE_MANAGEMENT_MUTED_TEXT_CLASS,
  COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS,
} from '../../courseManagementTheme';
import type { MetricCard } from './types';

export function MetricGrid({
  cardClass,
  columnsClass,
  items,
}: {
  cardClass: string;
  columnsClass: string;
  items: MetricCard[];
}) {
  return (
    <div className={`grid gap-4 ${columnsClass}`}>
      {items.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <motion.div
            key={metric.label}
            animate={{ opacity: 1, y: 0 }}
            className={cardClass}
            initial={{ opacity: 0, y: 12 }}
            transition={{ delay: index * 0.08 }}
          >
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${metric.gradient}`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div className={`mb-1 text-2xl font-bold ${COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS}`}>{metric.value}</div>
            <div className={`text-xs font-semibold uppercase tracking-wide ${COURSE_MANAGEMENT_MUTED_TEXT_CLASS}`}>{metric.label}</div>
            {metric.sublabel ? <div className={`mt-2 text-xs ${COURSE_MANAGEMENT_MUTED_TEXT_CLASS}`}>{metric.sublabel}</div> : null}
          </motion.div>
        );
      })}
    </div>
  );
}
