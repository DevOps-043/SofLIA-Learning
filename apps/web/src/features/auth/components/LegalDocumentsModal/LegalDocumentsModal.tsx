'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, FileText, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LegalDocumentTab } from '../../types/auth.types';
import {
  getLegalDocument,
  LEGAL_DOCUMENT_TABS,
} from './LegalDocumentsModal.data';

interface LegalDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

export function LegalDocumentsModal({
  isOpen,
  onClose,
  onAccept,
}: LegalDocumentsModalProps) {
  const { t } = useTranslation('legal');
  const [activeTab, setActiveTab] = useState<LegalDocumentTab>('terms');
  const currentDocument = getLegalDocument(t, activeTab);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      >
        <motion.button
          type="button"
          aria-label={t('modal.close')}
          className="absolute inset-0 bg-carbon-900/70 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="legal-documents-title"
          initial={{ scale: 0.96, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 16 }}
          transition={{ duration: 0.18 }}
          onClick={(event) => event.stopPropagation()}
          className="relative flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-primary/20 dark:border-white/10 dark:bg-carbon-800"
        >
          <div className="relative overflow-hidden border-b border-white/10 bg-primary px-5 py-5 text-white sm:px-6">
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-accent via-accent/70 to-transparent" />
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="rounded-xl bg-white/10 p-2 ring-1 ring-white/15">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 id="legal-documents-title" className="truncate text-xl font-bold">
                    {t('modal.title')}
                  </h2>
                  <p className="mt-1 hidden text-sm text-white/70 sm:block">
                    {currentDocument.title}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label={t('modal.close')}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="border-b border-gray-200 bg-gray-50 px-3 py-3 dark:border-white/10 dark:bg-carbon-950 sm:px-4">
            <div className="flex gap-2 overflow-x-auto">
              {LEGAL_DOCUMENT_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all sm:px-4 ${
                      isActive
                        ? 'bg-primary text-white shadow-md shadow-primary/20 dark:bg-accent dark:text-primary'
                        : 'text-gray-600 hover:bg-white hover:text-primary dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{t(tab.labelKey)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-white px-5 py-6 dark:bg-carbon-900 sm:px-6">
            <div className="mx-auto max-w-3xl space-y-7">
              {currentDocument.sections.map((section) => (
                <section key={section.number} className="space-y-3">
                  <h3 className="text-lg font-bold leading-tight text-primary dark:text-white">
                    {section.number}. {section.title}
                  </h3>
                  <p className="leading-7 text-gray-700 dark:text-gray-300">
                    {section.content}
                  </p>
                  {section.list && (
                    <ul className="ml-5 list-disc space-y-2 marker:text-accent">
                      {section.list.map((item, index) => (
                        <li key={index} className="pl-1 leading-7 text-gray-700 dark:text-gray-300">
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-carbon-950 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-primary transition-all hover:border-primary/30 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-accent dark:border-white/10 dark:bg-carbon-800 dark:text-white dark:hover:bg-white/5"
            >
              <X className="h-4 w-4" />
              {t('modal.close')}
            </button>
            {onAccept && (
              <button
                type="button"
                onClick={() => {
                  onAccept();
                  onClose();
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-accent dark:bg-accent dark:text-primary dark:hover:bg-accent/90"
              >
                <Check className="h-4 w-4" />
                {t('modal.accept')}
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
