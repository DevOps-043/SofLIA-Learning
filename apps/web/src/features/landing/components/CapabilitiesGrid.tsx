'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { capabilities } from './capabilities-grid/capabilities.config';
import { capabilitiesContainerVariants } from './capabilities-grid/capabilities.motion';
import { CapabilitiesHeader } from './capabilities-grid/CapabilitiesHeader';
import { CapabilityCard } from './capabilities-grid/CapabilityCard';

export function CapabilitiesGrid() {
  const { t } = useTranslation('common');
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section
      id="capabilities"
      ref={sectionRef}
      className="relative overflow-hidden bg-gray-100/20 py-20 dark:bg-gray-900 lg:py-32"
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>

      <div className="container relative z-10 mx-auto px-4 lg:px-8">
        <CapabilitiesHeader isInView={isInView} t={t} />

        <motion.div
          variants={capabilitiesContainerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {capabilities.map((capability) => (
            <CapabilityCard key={capability.key} capability={capability} t={t} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
