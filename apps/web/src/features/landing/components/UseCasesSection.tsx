'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { useMotionSafe } from '../../../lib/utils/motion';
import { UseCaseCard } from './use-cases-section/UseCaseCard';
import { UseCasesHeader } from './use-cases-section/UseCasesHeader';
import { useCases } from './use-cases-section/use-cases.config';
import { useCasesContainerVariants } from './use-cases-section/use-cases.motion';

export function UseCasesSection() {
  const { t } = useTranslation('common');
  const { disableHeavy } = useMotionSafe();
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section
      id="use-cases"
      ref={sectionRef}
      className="relative overflow-hidden bg-gradient-to-b from-white to-gray-100/30 py-20 dark:from-gray-800 dark:to-gray-900 lg:py-32"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
      </div>

      <div className="container relative z-10 mx-auto px-4 lg:px-8">
        <UseCasesHeader isInView={isInView} t={t} />

        <motion.div
          variants={useCasesContainerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8"
        >
          {useCases.map((useCase) => (
            <UseCaseCard
              key={useCase.key}
              disableHeavy={disableHeavy}
              t={t}
              useCase={useCase}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
