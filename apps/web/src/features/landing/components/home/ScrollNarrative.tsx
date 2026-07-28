'use client';

import {
  Activity,
  Layers3,
  Network,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './SofliaHome.module.css';
import { useScrollStage } from './useScrollStage';

const slideVariants: Variants = {
  initial: { opacity: 0, y: 30, filter: 'blur(10px)' },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.55,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.055,
      delayChildren: 0.04,
    },
  },
  exit: {
    opacity: 0,
    y: -24,
    filter: 'blur(8px)',
    transition: { duration: 0.32, ease: [0.4, 0, 1, 1] },
  },
};

const slideChildVariants: Variants = {
  initial: { opacity: 0, y: 22 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 260, damping: 26 },
  },
  exit: { opacity: 0, y: -10 },
};

const NARRATIVE_ICONS: LucideIcon[] = [Activity, Layers3, Network, Sparkles];

interface NarrativeSlide {
  kicker: string;
  title: string;
  description: string;
  points: string[];
}

export function ScrollNarrative() {
  const { t } = useTranslation('home');
  const sectionRef = useRef<HTMLElement>(null);
  const slides = t('narrative.slides', { returnObjects: true }) as NarrativeSlide[];
  const { activeStage: activeSlide, goToStage: goToSlide } = useScrollStage(
    sectionRef,
    slides.length,
  );
  const ActiveIcon = NARRATIVE_ICONS[activeSlide] ?? Activity;

  return (
    <section ref={sectionRef} className={styles.narrative} aria-labelledby="narrative-title">
      <div className={styles.narrativeSticky}>
        <div className={styles.narrativeAura} aria-hidden="true" />
        <div className={`${styles.shell} ${styles.narrativeDesktop}`}>
          <aside className={styles.narrativeAside}>
            <p id="narrative-title" className={styles.eyebrow}>
              {t('narrative.eyebrow')}
            </p>
            <div className={styles.narrativeCounter} aria-live="polite">
              <strong>{String(activeSlide + 1).padStart(2, '0')}</strong>
              {' / '}
              {String(slides.length).padStart(2, '0')}
            </div>
            <nav
              className={styles.narrativeRail}
              aria-label={t('narrative.navigationLabel')}
            >
              {slides.map((slide, index) => (
                <button
                  key={slide.kicker}
                  type="button"
                  className={`${styles.narrativeStep} ${
                    index === activeSlide ? styles.narrativeDotActive : ''
                  }`}
                  onClick={() => goToSlide(index)}
                  aria-label={t('narrative.goToSlide', { number: index + 1 })}
                  aria-current={index === activeSlide ? 'step' : undefined}
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <i aria-hidden="true" />
                  <strong>{slide.kicker.replace(/^\d+\s*·\s*/, '')}</strong>
                </button>
              ))}
            </nav>
          </aside>

          <div className={styles.narrativeStage}>
            <div className={styles.narrativeStageTop}>
              <span>{t('narrative.eyebrow')}</span>
              <div className={styles.narrativeStageProgress} aria-hidden="true">
                <motion.i
                  animate={{ scaleX: (activeSlide + 1) / Math.max(slides.length, 1) }}
                  transition={{ type: 'spring', stiffness: 170, damping: 28 }}
                />
              </div>
              <span>{String(activeSlide + 1).padStart(2, '0')}</span>
            </div>

            <div className={styles.narrativeStageBody} aria-live="polite">
              <AnimatePresence initial={false} mode="sync">
                <motion.article
                  key={activeSlide}
                  className={styles.slide}
                  variants={slideVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <motion.div
                    variants={slideChildVariants}
                    className={styles.slideIcon}
                    aria-hidden="true"
                  >
                    <ActiveIcon size={20} strokeWidth={1.7} />
                  </motion.div>
                  <motion.p variants={slideChildVariants} className={styles.slideKicker}>
                    {slides[activeSlide]?.kicker}
                  </motion.p>
                  <motion.h2 variants={slideChildVariants} className={styles.slideTitle}>
                    {slides[activeSlide]?.title}
                  </motion.h2>
                  <motion.p
                    variants={slideChildVariants}
                    className={styles.slideDescription}
                  >
                    {slides[activeSlide]?.description}
                  </motion.p>
                  {slides[activeSlide]?.points?.length ? (
                    <ul className={styles.slidePoints}>
                      {slides[activeSlide].points.map((point) => (
                        <motion.li
                          key={point}
                          variants={slideChildVariants}
                          className={styles.slidePoint}
                        >
                          {point}
                        </motion.li>
                      ))}
                    </ul>
                  ) : null}
                </motion.article>
              </AnimatePresence>
            </div>

            <div className={styles.narrativeSignal} aria-hidden="true">
              <motion.div
                className={styles.narrativeSignalOrbit}
                animate={{ rotate: activeSlide * 72 }}
                transition={{ type: 'spring', stiffness: 65, damping: 22 }}
              >
                <i />
                <i />
                <i />
              </motion.div>
              <motion.span
                key={activeSlide}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 170, damping: 20 }}
              >
                {String(activeSlide + 1).padStart(2, '0')}
              </motion.span>
            </div>
          </div>
        </div>

        <div className={`${styles.shell} ${styles.narrativeMobile}`}>
          <p id="narrative-title-mobile" className={styles.eyebrow}>
            {t('narrative.eyebrow')}
          </p>
          <div className={styles.narrativeMobileList}>
            {slides.map((slide, index) => {
              const Icon = NARRATIVE_ICONS[index] ?? Activity;
              return (
                <motion.article
                  key={slide.kicker}
                  className={styles.narrativeMobileCard}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.28 }}
                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className={styles.narrativeMobileCardTop}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <Icon size={18} aria-hidden="true" />
                  </div>
                  <p className={styles.slideKicker}>{slide.kicker}</p>
                  <h2 className={styles.slideTitle}>{slide.title}</h2>
                  <p className={styles.slideDescription}>{slide.description}</p>
                  <ul className={styles.slidePoints}>
                    {slide.points.map((point) => (
                      <li key={point} className={styles.slidePoint}>
                        {point}
                      </li>
                    ))}
                  </ul>
                </motion.article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
