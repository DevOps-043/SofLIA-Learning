'use client';

import React, { useRef } from 'react';
import { useInView } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { useMotionSafe } from '../../../lib/utils/motion';
import { ROIImpactHeader } from './roi-impact-section/ROIImpactHeader';
import { ROIMetricCard } from './roi-impact-section/ROIMetricCard';
import { roiMetrics } from './roi-impact-section/roi-impact.config';

export function ROIImpactSection() {
  const { t } = useTranslation('common');
  const { disableHeavy } = useMotionSafe();
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-primary py-20 lg:py-32">
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-400/30 to-transparent" />
      </div>

      <div className="container relative z-10 mx-auto px-4 lg:px-8">
        <ROIImpactHeader isInView={isInView} t={t} />

        <div className="mb-16 grid grid-cols-2 gap-6 lg:grid-cols-4 lg:gap-8">
          {roiMetrics.map((metric, index) => (
            <ROIMetricCard
              key={metric.key}
              disableHeavy={disableHeavy}
              index={index}
              isInView={isInView}
              metric={metric}
              t={t}
            />
          ))}
        </div>

        <p className="text-center text-sm text-white/40">
          {t(
            'landing.roi.disclaimer',
            '* Metricas basadas en resultados promedio de clientes. Los resultados pueden variar segun la implementacion.'
          )}
        </p>
      </div>
    </section>
  );
}
