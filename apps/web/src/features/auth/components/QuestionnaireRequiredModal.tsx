'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X, AlertCircle, ArrowRight } from 'lucide-react';

interface QuestionnaireRequiredModalProps {
  isOpen: boolean;
  onContinue: () => void;
  onCancel: () => void;
  isOAuthUser?: boolean;
}

export function QuestionnaireRequiredModal({
  isOpen,
  onContinue,
  onCancel,
  isOAuthUser = false,
}: QuestionnaireRequiredModalProps) {
  const { t } = useTranslation('common');
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#0F1419]/80 backdrop-blur-sm"
          onClick={onCancel}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white dark:bg-[#1E2329] backdrop-blur-sm rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8 z-10 border border-gray-200 dark:border-[#0A2540]/30"
        >
          {/* Close button */}
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            aria-label={t('auth.questionnaireModal.close')}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {t('auth.questionnaireModal.title')}
            </h2>
            <p className="text-gray-600 dark:text-white/70 mb-4">
              {isOAuthUser ? (
                <>
                  {t('auth.questionnaireModal.description')}
                  {' '}
                  {t('auth.questionnaireModal.oauthDescription')}
                </>
              ) : (
                <>
                  {t('auth.questionnaireModal.description')}
                </>
              )}
            </p>
            {isOAuthUser && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mt-4">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  {t('auth.questionnaireModal.mandatoryNotice')}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-white/90 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-carbon-700/50 transition-colors bg-white dark:bg-carbon-700/30"
            >
              {t('auth.questionnaireModal.nowNot')}
            </button>
            <button
              onClick={onContinue}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-purple-500 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center space-x-2"
            >
              <span>{t('auth.questionnaireModal.continue')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

