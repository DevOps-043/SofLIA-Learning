'use client';

import { ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { BlurText } from './react-bits/BlurText';
import { HomeFooter } from './HomeFooter';
import styles from './SofliaHome.module.css';

export function FinalCTA() {
  const { t } = useTranslation('home');
  const journey = ['diagnosis', 'adoption', 'impact'] as const;

  return (
    <>
      <section className={`${styles.finalCta} ${styles.shell}`}>
        <motion.div
          className={styles.finalCard}
          initial={{ opacity: 0, y: 36 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className={styles.finalGlow} aria-hidden="true" />

          <div className={styles.finalLayout}>
            <div className={styles.finalContent}>
              <p className={styles.finalEyebrow}>{t('final.eyebrow')}</p>
              <h2 className={styles.finalTitle}>
                <BlurText text={t('final.title')} delay={48} />
              </h2>
              <p className={styles.finalDescription}>{t('final.description')}</p>
              <div className={styles.finalActions}>
                <Link href="/contact?interest=assessment" className={styles.finalPrimary}>
                  {t('final.primaryCta')}
                  <ArrowUpRight size={17} aria-hidden="true" />
                </Link>
              </div>
              <p className={styles.finalNote}>{t('final.note')}</p>
            </div>

            <div className={styles.finalJourney} aria-label={t('hero.stagesLabel')}>
              <div className={styles.finalJourneyHeader}>
                <span>{t('hero.stagesLabel')}</span>
                <strong>01—03</strong>
              </div>

              <div className={styles.finalJourneyRail} aria-hidden="true">
                <i />
              </div>

              <div className={styles.finalJourneySteps}>
                {journey.map((stage, index) => (
                  <motion.div
                    key={stage}
                    className={styles.finalJourneyStep}
                    initial={{ opacity: 0, x: 24 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.7 }}
                    transition={{
                      duration: 0.55,
                      delay: 0.14 + index * 0.12,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <strong>{t(`hero.stages.${stage}`)}</strong>
                    <i aria-hidden="true" />
                  </motion.div>
                ))}
              </div>

              <p className={styles.finalJourneyCaption}>
                <span aria-hidden="true" />
                {t('hero.stages.impact')}
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      <HomeFooter />
    </>
  );
}
