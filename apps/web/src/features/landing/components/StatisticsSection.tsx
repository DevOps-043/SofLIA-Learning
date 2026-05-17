'use client';

import React, { useRef } from 'react';
import type { Statistic } from '@aprende-y-aplica/shared';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';

import { useMotionSafe } from '../../../lib/utils/motion';
import { StatisticCard } from './statistics-section/StatisticCard';

interface StatisticsSectionProps {
  statistics: Statistic[];
}

export function StatisticsSection({ statistics }: StatisticsSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const { disableHeavy } = useMotionSafe();
  const isInView = useInView(sectionRef, { once: false, amount: 0.1 });
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const scale = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    disableHeavy ? [1, 1, 1] : [0.8, 1, 1.1]
  );

  return (
    <section ref={sectionRef} className="relative py-16 lg:py-20">
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-accent"
        style={{ opacity: 1, scale }}
      />
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:radial-gradient(circle_at_2px_2px,white_1px,transparent_0)] [background-size:60px_60px]" />

      <div className="container relative z-10 mx-auto px-4">
        <div className="grid grid-cols-2 items-center gap-8 lg:grid-cols-4 lg:gap-12">
          {statistics.map((stat, index) => (
            <StatisticCard
              key={`${stat.label}-${index}`}
              disableHeavy={disableHeavy}
              index={index}
              isInView={isInView}
              stat={stat}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
