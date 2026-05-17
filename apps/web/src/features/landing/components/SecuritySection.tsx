'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { securityFeatures } from './security-section/security.config';
import { securityContainerVariants } from './security-section/security.motion';
import { SecurityEnterpriseBadge } from './security-section/SecurityEnterpriseBadge';
import { SecurityFeatureCard } from './security-section/SecurityFeatureCard';
import { SecurityHeader } from './security-section/SecurityHeader';

export function SecuritySection() {
  const { t } = useTranslation('common');
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section
      id="security"
      ref={sectionRef}
      className="relative overflow-hidden bg-gray-100/30 py-20 dark:bg-gray-900 lg:py-32"
    >
      <div className="container relative z-10 mx-auto px-4 lg:px-8">
        <SecurityHeader isInView={isInView} t={t} />

        <motion.div
          variants={securityContainerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {securityFeatures.map((feature) => (
            <SecurityFeatureCard key={feature.key} feature={feature} t={t} />
          ))}
        </motion.div>

        <SecurityEnterpriseBadge isInView={isInView} t={t} />
      </div>
    </section>
  );
}
