'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { trustBadges } from './trust-section/trust.config';
import { trustContainerVariants } from './trust-section/trust.motion';
import { TrustBadgeCard } from './trust-section/TrustBadgeCard';
import { TrustStats } from './trust-section/TrustStats';

export function TrustSection() {
  const { t } = useTranslation('common');

  return (
    <section className="bg-white py-16 dark:bg-gray-800 lg:py-24">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center lg:mb-16"
        >
          <h2 className="mb-4 text-3xl font-bold text-primary dark:text-white lg:text-4xl">
            {t('landing.trust.title', 'Enterprise-ready desde el dia uno')}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-white/60">
            {t(
              'landing.trust.subtitle',
              'Disenada para cumplir con los estandares mas exigentes de capacitacion corporativa'
            )}
          </p>
        </motion.div>

        <motion.div
          variants={trustContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6 lg:gap-6"
        >
          {trustBadges.map((badge) => (
            <TrustBadgeCard key={badge.key} badge={badge} t={t} />
          ))}
        </motion.div>

        <TrustStats t={t} />
      </div>
    </section>
  );
}
