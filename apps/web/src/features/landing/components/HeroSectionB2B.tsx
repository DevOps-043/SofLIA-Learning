'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { useMotionSafe } from '../../../lib/utils/motion';
import { ArrowRight, Calendar, FileText, CheckCircle2, BarChart3, Rocket, LucideIcon, GraduationCap, Sparkles } from 'lucide-react';

// framer-motion removed — all animations are CSS keyframes (tailwind/keyframes.js).
// Keeps framer-motion (~200 KB gzipped) out of the landing-page initial bundle.

interface Benefit {
  key: string;
  icon: LucideIcon;
}

const benefits: Benefit[] = [
  { key: 'aiPowered', icon: Sparkles },
  { key: 'measurable', icon: BarChart3 },
  { key: 'scalable', icon: Rocket },
];

// Stagger helper — replaces framer-motion staggerChildren via CSS animation-delay.
function stagger(delayMs: number): React.CSSProperties {
  return { animationDelay: `${delayMs}ms` };
}

// Shared class for the content cascade.
// Uses the existing slideInUp keyframe with the same cubic-bezier as the
// previous framer-motion fadeInUp variant.
const FADE_IN_UP = 'animate-[slideInUp_0.6s_cubic-bezier(0.16,1,0.3,1)_both]';

export function HeroSectionB2B() {
  const { t } = useTranslation('common');
  const { disableHeavy } = useMotionSafe();

  return (
    <section className="min-h-screen flex items-center relative overflow-hidden bg-white dark:bg-carbon-900 pt-20">
      {/*
        Background Elements. The animated radial-gradient orbs are large
        decorative elements that pin GPU composition layers in WebKit and
        were a major source of overheating on iPhone/iPad/Mac. When
        disableHeavy is on, we skip them entirely.
      */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        {!disableHeavy && (
          <>
            <div
              className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] rounded-full opacity-20 dark:opacity-10 animate-hero-orb-1"
              style={{ background: 'radial-gradient(circle, rgba(0, 212, 179, 0.3), transparent 60%)' }}
            />
            <div
              className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full opacity-20 dark:opacity-10 animate-hero-orb-2"
              style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3), transparent 60%)' }}
            />
          </>
        )}

        {/* Grid Pattern (flat painted bg, no GPU layer) */}
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, var(--color-primary) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Content staggered via CSS animation-delay */}
          <div className="max-w-2xl">
            {/* Tag */}
            <div className={`mb-6 ${FADE_IN_UP}`} style={stagger(0)}>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                {t('landing.hero.tag', 'Plataforma B2B de Capacitacion en IA')}
              </span>
            </div>

            {/* Headline */}
            <h1
              className={`text-4xl lg:text-5xl xl:text-6xl font-bold leading-[1.1] text-primary dark:text-white mb-6 ${FADE_IN_UP}`}
              style={stagger(150)}
            >
              {t('landing.hero.title', 'Capacitacion en IA con')}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-success">
                {t('landing.hero.highlight', 'impacto medible')}
              </span>{' '}
              {t('landing.hero.titleEnd', 'para tu organizacion')}
            </h1>

            {/* Subheadline */}
            <p
              className={`text-lg lg:text-xl text-gray-500 dark:text-white/70 mb-8 leading-relaxed ${FADE_IN_UP}`}
              style={stagger(300)}
            >
              {t('landing.hero.description', 'SofLIA es la plataforma de capacitacion corporativa que combina inteligencia artificial, planificacion inteligente y certificaciones verificables para desarrollar las competencias de tu equipo.')}
            </p>

            {/* CTA Buttons */}
            <div className={`flex flex-col sm:flex-row gap-4 mb-10 ${FADE_IN_UP}`} style={stagger(450)}>
              <Link href="/contact">
                <button className="w-full sm:w-auto px-8 py-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium text-lg flex items-center justify-center gap-3 shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]">
                  <Calendar size={20} />
                  {t('landing.hero.ctaPrimary', 'Agendar demo ejecutiva')}
                  <ArrowRight size={18} />
                </button>
              </Link>

              <Link href="/contact">
                <button className="w-full sm:w-auto px-8 py-4 rounded-xl border-2 border-accent text-accent hover:bg-accent/10 font-medium text-lg flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]">
                  <FileText size={20} />
                  {t('landing.hero.ctaSecondary', 'Solicitar diagnostico')}
                </button>
              </Link>
            </div>

            {/* Micro Proof */}
            <div className={`flex flex-wrap items-center gap-6 ${FADE_IN_UP}`} style={stagger(600)}>
              {benefits.map((benefit) => (
                <div key={benefit.key} className="flex items-center gap-2 text-sm text-gray-500 dark:text-white/60">
                  <benefit.icon size={18} className="text-accent" />
                  <span>{t(`landing.hero.benefits.${benefit.key}`, benefit.key)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Visual */}
          <div className={`relative flex items-center justify-center ${FADE_IN_UP}`} style={stagger(300)}>
            {/* Main Logo with Glow */}
            <div className="relative w-full max-w-[400px] lg:max-w-[480px]">
              {/* Glow Effect skipped on heat-sensitive devices */}
              {!disableHeavy && (
                <div
                  className="absolute inset-0 rounded-full blur-3xl animate-hero-glow-pulse"
                  style={{ background: 'radial-gradient(circle, var(--color-accent), transparent 70%)' }}
                />
              )}

              {/* Logo: float animation only when allowed */}
              <div className={`relative aspect-square${!disableHeavy ? ' animate-hero-float' : ''}`}>
                <Image
                  src="/Logo.png"
                  alt="SofLIA"
                  fill
                  className="object-contain drop-shadow-2xl"
                  sizes="(min-width: 1024px) 480px, 80vw"
                  priority
                />
              </div>
            </div>

            {/* Floating Card left */}
            <div className="absolute -left-4 lg:-left-12 top-1/4 bg-white dark:bg-carbon-800 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/30 p-4 border border-gray-200 dark:border-white/10 animate-hero-card-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-success flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-white/50">{t('landing.badges.completion', 'Completitud')}</p>
                  <p className="text-lg font-bold text-primary dark:text-white">+85%</p>
                </div>
              </div>
            </div>

            {/* Floating Card right */}
            <div className="absolute -right-4 lg:-right-8 bottom-1/4 bg-white dark:bg-carbon-800 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/30 p-4 border border-gray-200 dark:border-white/10 animate-hero-card-right">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-[var(--color-legacy-6366f1)] flex items-center justify-center">
                  <GraduationCap size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-white/50">{t('landing.badges.mentorship', 'Mentoria')}</p>
                  <p className="text-lg font-bold text-accent">24/7</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
