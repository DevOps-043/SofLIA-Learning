'use client';

import {
  ArrowRight,
  DraftingCompass,
  Gauge,
  GraduationCap,
  HandHelping,
  ListChecks,
  Rocket,
  Search,
  SlidersHorizontal,
  Sparkles,
  Target,
  Workflow,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SectionHeading } from './SectionHeading';
import { StarBorder } from './react-bits/StarBorder';
import styles from './SofliaHome.module.css';

interface MethodPhase {
  name: string;
  description: string;
  points: string[];
  outcome: string;
}

const PHASE_ICONS = [
  Search,
  ListChecks,
  DraftingCompass,
  GraduationCap,
  Target,
  HandHelping,
  Gauge,
  SlidersHorizontal,
  Rocket,
] as const;

const AUTOPLAY_INTERVAL_MS = 5200;
const STACK_DEPTH = 3;

export function MethodSection() {
  const { t } = useTranslation('home');
  const reduceMotion = useReducedMotion();
  const phases = t('method.phases', { returnObjects: true }) as MethodPhase[];
  const sectionRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.25 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reduceMotion || isPaused || !isInView || phases.length < 2) return;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % phases.length);
    }, AUTOPLAY_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [activeIndex, isInView, isPaused, phases.length, reduceMotion]);

  const stackDepth = reduceMotion ? 1 : Math.min(STACK_DEPTH, phases.length);
  const stackedPhases = Array.from({ length: stackDepth }, (_, depth) => {
    const phaseIndex = (activeIndex + depth) % phases.length;
    return { phase: phases[phaseIndex], phaseIndex, depth };
  });

  return (
    <section
      id="metodologia"
      ref={sectionRef}
      className={`${styles.section} ${styles.shell}`}
      onPointerEnter={() => setIsPaused(true)}
      onPointerLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      <SectionHeading
        eyebrow={t('method.eyebrow')}
        title={t('method.title')}
        description={t('method.description')}
      />

      <StarBorder className={styles.methodFormulaBorder} speed="5s">
        <Workflow size={16} aria-hidden="true" />
        <span className={styles.methodFormulaLead}>{t('method.formulaLead')}</span>
        <ArrowRight size={14} aria-hidden="true" />
        {t('method.formulaResult')}
      </StarBorder>

      <div className={styles.methodLayout}>
        <div className={styles.methodStack} aria-hidden="true">
          <AnimatePresence initial={false}>
            {stackedPhases.map(({ phase, phaseIndex, depth }) => {
              const PhaseIcon = PHASE_ICONS[phaseIndex] ?? Sparkles;
              return (
                <motion.article
                  key={phaseIndex}
                  className={styles.methodCard}
                  initial={
                    reduceMotion
                      ? false
                      : { x: 40 + depth * 26, y: -depth * 24, scale: 0.9, opacity: 0 }
                  }
                  animate={{
                    x: depth * 26,
                    y: -depth * 24,
                    scale: 1 - depth * 0.05,
                    opacity: 1 - depth * 0.22,
                    rotateZ: depth * 1.4,
                    zIndex: stackDepth - depth,
                  }}
                  exit={
                    reduceMotion
                      ? { opacity: 0 }
                      : { y: 110, opacity: 0, rotateZ: -5, scale: 0.95 }
                  }
                  transition={{ type: 'spring', stiffness: 240, damping: 27 }}
                >
                  <header className={styles.methodCardHeader}>
                    <span className={styles.methodCardIcon}>
                      <PhaseIcon size={19} aria-hidden="true" />
                    </span>
                    <span className={styles.methodCardNumber}>
                      {String(phaseIndex + 1).padStart(2, '0')}
                    </span>
                  </header>
                  <h3>{phase.name}</h3>
                  <p>{phase.description}</p>
                  <ul className={styles.methodCardPoints}>
                    {phase.points?.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                  <footer className={styles.methodCardFooter}>
                    <span className={styles.methodCardOutcome}>{phase.outcome}</span>
                    <span className={styles.methodCardCounter}>
                      {phaseIndex + 1} / {phases.length}
                    </span>
                  </footer>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>

        <ol className={styles.methodRail}>
          {phases.map((phase, index) => {
            const isActive = index === activeIndex;
            return (
              <motion.li
                key={phase.name}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
              >
                <button
                  type="button"
                  className={`${styles.methodRailItem} ${
                    isActive ? styles.methodRailItemActive : ''
                  }`}
                  onClick={() => setActiveIndex(index)}
                  aria-current={isActive ? 'step' : undefined}
                >
                  <span className={styles.methodRailNumber}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className={styles.methodRailName}>{phase.name}</span>
                  {isActive && !reduceMotion ? (
                    <motion.span
                      key={`progress-${activeIndex}-${isPaused}`}
                      className={styles.methodRailProgress}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: isPaused ? 0 : 1 }}
                      transition={{
                        duration: AUTOPLAY_INTERVAL_MS / 1000,
                        ease: 'linear',
                      }}
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
