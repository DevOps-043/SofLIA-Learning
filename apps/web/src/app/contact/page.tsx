'use client';

import { motion } from 'framer-motion';
import { ArrowRight, CalendarCheck, CheckCircle, Clock, Mail, MessageSquare, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { LandingFooter } from '@/features/landing/components/LandingFooter';
import { LandingHeader } from '@/features/landing/components/LandingHeader';
import { LandingContactForm } from '@/features/landing/components/contact/LandingContactForm';

const contactHighlights = [
  { icon: CalendarCheck, key: 'demo' },
  { icon: MessageSquare, key: 'assessment' },
  { icon: ShieldCheck, key: 'enterprise' },
] as const;

export default function ContactPage() {
  const { t } = useTranslation('common');

  return (
    <main className="min-h-screen bg-white text-primary transition-colors duration-300 dark:bg-carbon-900 dark:text-white">
      <LandingHeader />

      <section className="relative overflow-hidden border-b border-gray-200 bg-gradient-to-br from-gray-50 via-white to-gray-100 pt-20 dark:border-white/10 dark:from-carbon-900 dark:via-carbon-950 dark:to-carbon-900 lg:pt-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-120px] top-20 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute bottom-[-160px] right-[-80px] h-96 w-96 rounded-full bg-primary/10 blur-3xl dark:bg-accent/10" />
          <div
            className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
            style={{
              backgroundImage: 'linear-gradient(var(--color-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
        </div>

        <div className="container relative z-10 mx-auto px-4 py-10 lg:px-8 lg:py-14">
          <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="mb-6 inline-flex rounded-full bg-accent/10 px-4 py-2 text-sm font-semibold text-accent ring-1 ring-accent/20">
                {t('landing.contactPage.eyebrow')}
              </span>
              <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-primary dark:text-white lg:text-6xl">
                {t('landing.contactPage.title')}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600 dark:text-gray-300">
                {t('landing.contactPage.subtitle')}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="mailto:ernesto.hernandez@pulsehub.mx"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 dark:bg-accent dark:text-primary dark:hover:bg-accent/90"
                >
                  <Mail className="h-4 w-4" />
                  ernesto.hernandez@pulsehub.mx
                </a>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-primary transition-all hover:border-accent hover:text-accent dark:border-white/10 dark:bg-carbon-800 dark:text-white/80"
                >
                  {t('landing.contactPage.backHome')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {contactHighlights.map(({ icon: Icon, key }) => (
                  <div
                    key={key}
                    className="rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-carbon-800/80"
                  >
                    <Icon className="mb-3 h-5 w-5 text-accent" />
                    <p className="text-sm font-bold text-primary dark:text-white">
                      {t(`landing.contactPage.highlights.${key}.title`)}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                      {t(`landing.contactPage.highlights.${key}.description`)}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl shadow-primary/10 dark:border-white/10 dark:bg-carbon-800 sm:p-8"
            >
              <div className="mb-8">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold text-primary dark:text-white">
                  {t('landing.contactPage.formTitle')}
                </h2>
                <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                  {t('landing.contactPage.formSubtitle')}
                </p>
              </div>

              <LandingContactForm source="contact_page" tone="light" extended />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 dark:bg-carbon-900">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {['response', 'privacy', 'fit'].map((key) => (
              <div
                key={key}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-6 dark:border-white/10 dark:bg-carbon-800"
              >
                <CheckCircle className="mb-4 h-5 w-5 text-success" />
                <h3 className="text-lg font-bold text-primary dark:text-white">
                  {t(`landing.contactPage.assurances.${key}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                  {t(`landing.contactPage.assurances.${key}.description`)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Clock className="h-4 w-4 text-accent" />
            <span>{t('landing.contactPage.responseNote')}</span>
          </div>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
