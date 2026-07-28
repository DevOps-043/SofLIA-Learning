'use client';

import { motion } from 'motion/react';
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle,
  Clock,
  Mail,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { LandingContactForm } from '@/features/landing/components/contact/LandingContactForm';
import { HomeFooter } from '@/features/landing/components/home/HomeFooter';
import { HomeHeader } from '@/features/landing/components/home/HomeHeader';
import { ClickSpark } from '@/features/landing/components/home/react-bits/ClickSpark';
import homeStyles from '@/features/landing/components/home/SofliaHome.module.css';
import styles from './ContactPage.module.css';

const contactHighlights = [
  { icon: CalendarCheck, key: 'demo' },
  { icon: MessageSquare, key: 'assessment' },
  { icon: ShieldCheck, key: 'enterprise' },
] as const;

const assurances = ['response', 'privacy', 'fit'] as const;

export default function ContactPage() {
  const { t } = useTranslation('common');

  return (
    <main className={`${homeStyles.page} ${styles.contactPage}`}>
      <div className={homeStyles.noise} aria-hidden="true" />
      <ClickSpark>
        <HomeHeader />

        <section className={styles.contactHero} aria-labelledby="contact-title">
          <div className={styles.contactBackdrop} aria-hidden="true">
            <i />
            <i />
            <i />
          </div>

          <div className={`${homeStyles.shell} ${styles.contactGrid}`}>
            <motion.div
              className={styles.contactCopy}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className={styles.contactEyebrow}>
                <span aria-hidden="true" />
                {t('landing.contactPage.eyebrow')}
              </p>
              <h1 id="contact-title">{t('landing.contactPage.title')}</h1>
              <p className={styles.contactSubtitle}>
                {t('landing.contactPage.subtitle')}
              </p>

              <div className={styles.contactActions}>
                <a href="mailto:ernesto.hernandez@pulsehub.mx">
                  <Mail size={16} aria-hidden="true" />
                  ernesto.hernandez@pulsehub.mx
                </a>
                <Link href="/">
                  {t('landing.contactPage.backHome')}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>

              <div className={styles.contactJourney}>
                {contactHighlights.map(({ icon: Icon, key }, index) => (
                  <motion.article
                    key={key}
                    className={styles.journeyItem}
                    initial={{ opacity: 0, x: -18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.2 + index * 0.08,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    <div className={styles.journeyIndex}>
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <i aria-hidden="true" />
                    </div>
                    <div className={styles.journeyIcon}>
                      <Icon size={17} aria-hidden="true" />
                    </div>
                    <div>
                      <h2>{t(`landing.contactPage.highlights.${key}.title`)}</h2>
                      <p>{t(`landing.contactPage.highlights.${key}.description`)}</p>
                    </div>
                  </motion.article>
                ))}
              </div>
            </motion.div>

            <motion.div
              className={styles.formCard}
              initial={{ opacity: 0, y: 34, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.78, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className={styles.formCardTop}>
                <span>{t('landing.contactPage.eyebrow')}</span>
                <span>01 / 01</span>
              </div>
              <div className={styles.formHeading}>
                <div>
                  <MessageSquare size={20} aria-hidden="true" />
                </div>
                <span>
                  <h2>{t('landing.contactPage.formTitle')}</h2>
                  <p>{t('landing.contactPage.formSubtitle')}</p>
                </span>
              </div>

              <LandingContactForm source="contact_page" tone="home" extended />

              <p className={styles.formResponse}>
                <Clock size={14} aria-hidden="true" />
                {t('landing.contactPage.responseNote')}
              </p>
            </motion.div>
          </div>
        </section>

        <section className={`${homeStyles.shell} ${styles.assuranceSection}`}>
          <div className={styles.assuranceHeading}>
            <span>{t('landing.contactPage.eyebrow')}</span>
            <i aria-hidden="true" />
            <span>{t('landing.contactPage.responseNote')}</span>
          </div>
          <div className={styles.assuranceGrid}>
            {assurances.map((key, index) => (
              <motion.article
                key={key}
                className={styles.assuranceCard}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{
                  duration: 0.55,
                  delay: index * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                <CheckCircle size={19} aria-hidden="true" />
                <h2>{t(`landing.contactPage.assurances.${key}.title`)}</h2>
                <p>{t(`landing.contactPage.assurances.${key}.description`)}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <HomeFooter />
      </ClickSpark>
    </main>
  );
}
