'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { getLegalDocument } from '@/features/auth/components/LegalDocumentsModal/LegalDocumentsModal.data';

export default function PrivacyPage() {
  const { t, i18n } = useTranslation('legal');
  const privacyDocument = getLegalDocument(t, 'privacy');
  const locale = i18n.language === 'en' ? 'en-US' : i18n.language === 'pt' ? 'pt-BR' : 'es-MX';

  return (
    <div className="min-h-screen bg-white text-primary dark:bg-carbon-900 dark:text-white">
      <div className="border-b border-gray-200 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:border-white/10 dark:from-carbon-900 dark:via-carbon-950 dark:to-carbon-900">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-primary shadow-sm transition-all hover:border-accent hover:text-accent dark:border-white/10 dark:bg-carbon-800 dark:text-white/80 dark:hover:text-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('navigation.backHome')}
          </Link>

          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-accent/20 bg-accent/10 p-4 shadow-sm dark:bg-accent/15">
                <Shield className="h-8 w-8 text-primary dark:text-accent" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-primary dark:text-white sm:text-4xl">
                  {privacyDocument.title}
                </h1>
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  {t('metadata.lastUpdated', {
                    date: new Date().toLocaleDateString(locale, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }),
                  })}
                </p>
              </div>
            </div>
            <div className="h-1.5 w-32 rounded-full bg-gradient-to-r from-primary to-accent" />
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xl shadow-primary/5 dark:border-white/10 dark:bg-carbon-800 sm:p-8"
        >
          <div className="mx-auto max-w-3xl">
            {privacyDocument.sections.map((section, index) => (
              <motion.div
                key={section.number}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * (index + 1) }}
                className="border-b border-gray-200 py-7 first:pt-0 last:border-0 last:pb-0 dark:border-white/10"
              >
                <h2 className="mb-4 text-xl font-bold leading-tight text-primary dark:text-white sm:text-2xl">
                  {section.number}. {section.title}
                </h2>
                <p className="mb-4 text-base leading-8 text-gray-700 dark:text-gray-300">
                  {section.content}
                </p>
                {section.list && (
                  <ul className="ml-5 list-disc space-y-3 marker:text-accent">
                    {section.list.map((item, itemIndex) => (
                      <li key={itemIndex} className="pl-1 leading-7 text-gray-700 dark:text-gray-300">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          <p>
            {t('pages.privacy.footerPrefix')}{' '}
            <Link href="/contact" className="text-primary hover:underline dark:text-accent">
              {t('pages.contactLink')}
            </Link>
            {t('pages.footerSuffix')}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
