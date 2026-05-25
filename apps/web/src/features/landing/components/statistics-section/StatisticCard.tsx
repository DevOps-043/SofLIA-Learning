import type { Statistic } from '@aprende-y-aplica/shared';
import { motion } from 'framer-motion';

import { AnimatedStatisticCounter } from './AnimatedStatisticCounter';
import { getStatisticIcon } from './statistics-icons';

interface StatisticCardProps {
  disableHeavy: boolean;
  index: number;
  isInView: boolean;
  stat: Statistic;
}

export function StatisticCard({ disableHeavy, index, isInView, stat }: StatisticCardProps) {
  const Icon = getStatisticIcon(stat.label);

  return (
    <motion.div
      className="group relative text-center"
      initial={{ opacity: 0, y: 150, rotateX: -30 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay: index * 0.2, duration: 1, type: 'spring', stiffness: 80 }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <motion.div
        className="mb-4 flex justify-center"
        animate={!disableHeavy && isInView ? { y: [0, -10, 0], rotate: [0, 3, -3, 0] } : {}}
        transition={{ duration: 4, repeat: Infinity, delay: index * 0.5, ease: 'easeInOut' }}
      >
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-accent opacity-20 blur-xl" />
          <div className="relative flex h-12 w-12 items-center justify-center rounded-md border-2 border-accent/50 bg-gradient-to-br from-accent/40 to-accent/20 backdrop-blur-sm lg:h-14 lg:w-14">
            <Icon className="h-6 w-6 text-white lg:h-7 lg:w-7" />
          </div>
        </div>
      </motion.div>

      <div className="relative mb-2 text-white">
        <AnimatedStatisticCounter endValue={stat.value} />
      </div>

      <motion.p
        className="text-base font-medium text-white/90 lg:text-lg"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.2 + 0.6, duration: 0.8 }}
      >
        {stat.label}
      </motion.p>

      <motion.div
        className="absolute bottom-0 left-1/2 h-1 -translate-x-1/2 bg-gradient-to-r from-transparent via-accent to-transparent"
        initial={{ width: 0 }}
        whileInView={{ width: '80%' }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.2 + 0.8, duration: 1.2 }}
      />
    </motion.div>
  );
}
