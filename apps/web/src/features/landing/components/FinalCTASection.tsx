'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LandingContactForm } from './contact/LandingContactForm';

export function FinalCTASection() {
  const { t } = useTranslation('common');
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="relative overflow-hidden bg-gradient-to-b from-primary to-primary py-20 lg:py-32"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute top-1/4 -left-1/4 h-[600px] w-[600px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--color-accent), transparent)' }}
        />
        <div
          className="absolute bottom-1/4 -right-1/4 h-[600px] w-[600px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--color-secondary), transparent)' }}
        />
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <div className="container relative z-10 mx-auto px-4 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-6 inline-block rounded-full bg-accent/20 px-4 py-2 text-sm font-medium text-accent"
            >
              {t('landing.cta.tag')}
            </motion.span>

            <h2 className="mb-6 text-3xl font-bold leading-tight text-white lg:text-5xl">
              {t('landing.cta.title')}
            </h2>

            <p className="mx-auto max-w-2xl text-lg text-white/60 lg:text-xl">
              {t('landing.cta.subtitle')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur-xl lg:p-12"
          >
            <LandingContactForm source="landing_cta" tone="dark" />

            <p className="mt-6 text-center text-sm text-white/40">
              {t('landing.cta.form.alternative')}{' '}
              <a href="mailto:ernesto.hernandez@pulsehub.mx" className="text-accent hover:underline">
                ernesto.hernandez@pulsehub.mx
              </a>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-white/40"
          >
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-success" />
              <span>{t('landing.cta.trust.noCommitment')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-success" />
              <span>{t('landing.cta.trust.demo')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-success" />
              <span>{t('landing.cta.trust.response')}</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
