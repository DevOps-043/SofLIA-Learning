'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { useMotionSafe } from '../../../lib/utils/motion';
import { ArrowRight, Calendar, FileText, CheckCircle2, Bot, BarChart3, Rocket, LucideIcon, GraduationCap, Sparkles } from 'lucide-react';

interface Benefit {
  key: string;
  icon: LucideIcon;
}

const benefits: Benefit[] = [
  { key: 'aiPowered', icon: Sparkles },
  { key: 'measurable', icon: BarChart3 },
  { key: 'scalable', icon: Rocket },
];
// ... (omitting lines for brevity in replace call if possible, but replace_file_content needs contiguous block)
// I will split this into two calls or use a larger block. The imports are at the top, benefits list is next.
// And the floating card is at the bottom.
// I'll do imports and benefits first.


const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export function HeroSectionB2B() {
  const { t } = useTranslation('common');
  const { disableHeavy } = useMotionSafe();

  return (
    <section className="min-h-screen flex items-center relative overflow-hidden bg-white dark:bg-carbon-900 pt-20">
      {/*
        Background Elements.  The animated radial-gradient orbs are large
        decorative elements that pin GPU composition layers in WebKit and
        were a major source of overheating on iPhone/iPad/Mac.  When
        disableHeavy is on, we skip them entirely — the grid pattern stays
        because it's a flat painted background (no GPU layer).
      */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        {!disableHeavy && (
          <>
            <motion.div
              className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] rounded-full opacity-20 dark:opacity-10"
              style={{
                background: 'radial-gradient(circle, rgba(0, 212, 179, 0.3), transparent 60%)',
              }}
              animate={{ scale: [1, 1.1, 1], x: [0, 30, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full opacity-20 dark:opacity-10"
              style={{
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3), transparent 60%)',
              }}
              animate={{ scale: [1, 1.15, 1], y: [0, -30, 0] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            />
          </>
        )}

        {/* Grid Pattern (cheap — flat painted bg, no GPU layer) */}
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, var(--color-primary) 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Content */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="max-w-2xl"
          >
            {/* Tag */}
            <motion.div variants={fadeInUp} className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                {t('landing.hero.tag', 'Plataforma B2B de Capacitación en IA')}
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeInUp}
              className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-[1.1] text-primary dark:text-white mb-6"
            >
              {t('landing.hero.title', 'Capacitación en IA con')}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-success">
                {t('landing.hero.highlight', 'impacto medible')}
              </span>{' '}
              {t('landing.hero.titleEnd', 'para tu organización')}
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={fadeInUp}
              className="text-lg lg:text-xl text-gray-500 dark:text-white/70 mb-8 leading-relaxed"
            >
              {t('landing.hero.description', 'SofLIA es la plataforma de capacitación corporativa que combina inteligencia artificial, planificación inteligente y certificaciones verificables para desarrollar las competencias de tu equipo.')}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link href="#contact">
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: '0 12px 40px rgba(10, 37, 64, 0.3)' }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-primary hover:bg-primary text-white font-medium text-lg flex items-center justify-center gap-3 shadow-lg shadow-primary/25 transition-all duration-300"
                >
                  <Calendar size={20} />
                  {t('landing.hero.ctaPrimary', 'Agendar demo ejecutiva')}
                  <ArrowRight size={18} />
                </motion.button>
              </Link>
              
              <Link href="#contact">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl border-2 border-accent text-accent hover:bg-accent/10 font-medium text-lg flex items-center justify-center gap-3 transition-all duration-300"
                >
                  <FileText size={20} />
                  {t('landing.hero.ctaSecondary', 'Solicitar diagnóstico')}
                </motion.button>
              </Link>
            </motion.div>

            {/* Micro Proof */}
            <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-6">
              {benefits.map((benefit) => (
                <div key={benefit.key} className="flex items-center gap-2 text-sm text-gray-500 dark:text-white/60">
                  <benefit.icon size={18} className="text-accent" />
                  <span>{t(`landing.hero.benefits.${benefit.key}`, benefit.key)}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: Visual */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative flex items-center justify-center"
          >
            {/* Main Logo with Glow */}
            <div className="relative w-full max-w-[400px] lg:max-w-[480px]">
              {/* Glow Effect — skipped on heat-sensitive devices because the
                  blur-3xl on an absolutely-positioned element forces continuous
                  GPU compositing in WebKit. */}
              {!disableHeavy && (
                <motion.div
                  className="absolute inset-0 rounded-full blur-3xl opacity-30"
                  style={{
                    background: 'radial-gradient(circle, var(--color-accent), transparent 70%)',
                  }}
                  animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}

              {/* Logo — keep the floating animation only when allowed. */}
              {disableHeavy ? (
                <div className="relative aspect-square">
                  <Image
                    src="/Logo.png"
                    alt="SofLIA"
                  fill
                  className="object-contain drop-shadow-2xl"
                  sizes="(min-width: 1024px) 480px, 80vw"
                  priority
                />
                </div>
              ) : (
                <motion.div
                  animate={{ y: [0, -15, 0] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="relative aspect-square"
                >
                  <Image
                    src="/Logo.png"
                    alt="SofLIA"
                    fill
                    className="object-contain drop-shadow-2xl"
                    sizes="(min-width: 1024px) 480px, 80vw"
                    priority
                  />
                </motion.div>
              )}
            </div>

            {/* Floating Cards */}
            <motion.div
              initial={{ opacity: 0, x: -30, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="absolute -left-4 lg:-left-12 top-1/4 bg-white dark:bg-carbon-800 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/30 p-4 border border-gray-200 dark:border-white/10"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-success flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-white/50">Completitud</p>
                  <p className="text-lg font-bold text-primary dark:text-white">+85%</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30, y: -20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
              className="absolute -right-4 lg:-right-8 bottom-1/4 bg-white dark:bg-carbon-800 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/30 p-4 border border-gray-200 dark:border-white/10"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-[var(--color-legacy-6366f1)] flex items-center justify-center">
                  <GraduationCap size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-white/50">Mentoría</p>
                  <p className="text-lg font-bold text-accent">24/7</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
