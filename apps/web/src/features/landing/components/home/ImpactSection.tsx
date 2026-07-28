'use client';

import { Gauge, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useRef, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { SectionHeading } from './SectionHeading';
import styles from './SofliaHome.module.css';
import { useScrollStage } from './useScrollStage';

interface Benefit {
  title: string;
  description: string;
}

const BENEFIT_ICONS = [ShieldCheck, Gauge, TrendingUp, Sparkles] as const;

const AUDIENCE_POSITIONS = [
  { x: '7%', y: '12%' },
  { x: '49%', y: '5%' },
  { x: '72%', y: '18%' },
  { x: '77%', y: '51%' },
  { x: '56%', y: '76%' },
  { x: '24%', y: '78%' },
  { x: '3%', y: '56%' },
  { x: '10%', y: '34%' },
] as const;

export function ImpactSection() {
  const { t } = useTranslation('home');
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const audiences = t('impact.audiences', { returnObjects: true }) as string[];
  const benefits = t('impact.benefits', { returnObjects: true }) as Benefit[];
  const { activeStage, goToStage } = useScrollStage(sectionRef, benefits.length);
  const activeBenefit = benefits[activeStage] ?? benefits[0];
  const ActiveIcon = BENEFIT_ICONS[activeStage] ?? Sparkles;

  return (
    <section
      ref={sectionRef}
      className={styles.impactStory}
      aria-labelledby="impact-title"
    >
      <div className={styles.impactSticky}>
        <div className={styles.shell}>
          <SectionHeading
            eyebrow={t('impact.eyebrow')}
            title={t('impact.title')}
            description={t('impact.description')}
            titleId="impact-title"
          />

          <div className={styles.impactLayout}>
            <div className={styles.audiencePanel}>
              <div className={styles.impactPanelHeader}>
                <p className={styles.panelLabel}>{t('impact.audienceLabel')}</p>
                <span className={styles.impactStageCount} aria-hidden="true">
                  {String(activeStage + 1).padStart(2, '0')}
                  <small>/ {String(benefits.length).padStart(2, '0')}</small>
                </span>
              </div>

              <div
                className={styles.audienceNetwork}
                role="group"
                aria-label={t('impact.networkLabel')}
              >
                <span className={styles.audienceRing} aria-hidden="true" />
                <span
                  className={`${styles.audienceRing} ${styles.audienceRingInner}`}
                  aria-hidden="true"
                />
                <motion.div
                  className={styles.audienceCore}
                  key={activeStage}
                  initial={reduceMotion ? false : { scale: 0.86, opacity: 0.72 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 180, damping: 18 }}
                  aria-hidden="true"
                >
                  <span>SofLIA</span>
                  <strong>{String(activeStage + 1).padStart(2, '0')}</strong>
                </motion.div>

                <ul className={styles.audienceCloud}>
                  {audiences.map((audience, index) => {
                    const isActive = index % benefits.length === activeStage;
                    const position = AUDIENCE_POSITIONS[index % AUDIENCE_POSITIONS.length];
                    const chipStyle = {
                      '--audience-x': position?.x ?? '50%',
                      '--audience-y': position?.y ?? '50%',
                      '--audience-delay': `${index * -0.45}s`,
                    } as CSSProperties;

                    return (
                      <motion.li
                        key={audience}
                        className={`${styles.audienceChip} ${
                          isActive ? styles.audienceChipActive : ''
                        }`}
                        style={chipStyle}
                        initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, amount: 0.4 }}
                        transition={{
                          delay: index * 0.045,
                          duration: 0.65,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                      >
                        <span aria-hidden="true" />
                        {audience}
                      </motion.li>
                    );
                  })}
                </ul>
              </div>
            </div>

            <div className={styles.benefitsWrap}>
              <div className={styles.impactPanelHeader}>
                <p className={styles.panelLabel}>{t('impact.benefitsLabel')}</p>
                <div
                  className={styles.impactProgress}
                  role="progressbar"
                  aria-label={t('impact.progressLabel')}
                  aria-valuemin={1}
                  aria-valuemax={benefits.length}
                  aria-valuenow={activeStage + 1}
                >
                  <span
                    style={{
                      transform: `scaleX(${(activeStage + 1) / benefits.length})`,
                    }}
                  />
                </div>
              </div>

              <div className={styles.benefitStage}>
                <AnimatePresence mode="popLayout">
                  <motion.article
                    key={activeBenefit?.title}
                    className={styles.benefitFeature}
                    initial={
                      reduceMotion
                        ? false
                        : { opacity: 0, y: 45, rotateX: -8, filter: 'blur(9px)' }
                    }
                    animate={{ opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)' }}
                    exit={{
                      opacity: 0,
                      y: -24,
                      rotateX: 4,
                      filter: 'blur(5px)',
                      transition: { duration: 0.18, ease: 'easeIn' },
                    }}
                    transition={{ type: 'spring', stiffness: 155, damping: 22 }}
                  >
                    <div className={styles.benefitFeatureTop}>
                      <motion.span
                        className={styles.benefitIcon}
                        initial={reduceMotion ? false : { rotate: -20, scale: 0.75 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 220, damping: 17 }}
                      >
                        <ActiveIcon size={23} aria-hidden="true" />
                      </motion.span>
                      <span className={styles.benefitNumber} aria-hidden="true">
                        {String(activeStage + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <span className={styles.benefitKicker}>
                      {t('impact.stageLabel')} {String(activeStage + 1).padStart(2, '0')}
                    </span>
                    <h3>{activeBenefit?.title}</h3>
                    <p>{activeBenefit?.description}</p>
                    <div className={styles.benefitConnection} aria-hidden="true">
                      <span>{audiences[activeStage]}</span>
                      <i />
                      <span>{audiences[activeStage + benefits.length]}</span>
                    </div>
                  </motion.article>
                </AnimatePresence>
              </div>

              <div className={styles.impactNavigation}>
                {benefits.map((benefit, index) => (
                  <button
                    key={benefit.title}
                    type="button"
                    className={`${styles.impactNavItem} ${
                      index === activeStage ? styles.impactNavItemActive : ''
                    }`}
                    onClick={() => goToStage(index)}
                    aria-label={`${t('impact.stageLabel')} ${index + 1}: ${benefit.title}`}
                    aria-current={index === activeStage ? 'step' : undefined}
                  >
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <strong>{benefit.title}</strong>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
