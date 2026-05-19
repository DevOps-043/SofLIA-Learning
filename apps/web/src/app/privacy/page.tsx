'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { LEGAL_DOCUMENTS } from '@/features/auth/components/LegalDocumentsModal/LegalDocumentsModal.data';

export default function PrivacyPage() {
  const privacyDocument = LEGAL_DOCUMENTS.privacy;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-carbon-900 dark:via-carbon-800 dark:to-carbon-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary dark:text-accent hover:opacity-80 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 dark:bg-accent/20 rounded-lg">
              <Shield className="w-8 h-8 text-primary dark:text-accent" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-primary dark:text-white">
              {privacyDocument.title}
            </h1>
          </div>
          
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Última actualización: {new Date().toLocaleDateString('es-ES', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-carbon-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-500/30 p-6 sm:p-8"
        >
          <div className="prose prose-slate dark:prose-invert max-w-none">
            {privacyDocument.sections.map((section, index) => (
              <motion.div
                key={section.number}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (index + 1) }}
                className="mb-8 last:mb-0"
              >
                <h2 className="text-2xl font-bold text-primary dark:text-white mb-4 mt-8 first:mt-0">
                  {section.number}. {section.title}
                </h2>
                <p className="text-primary dark:text-gray-300 leading-relaxed mb-4">
                  {section.content}
                </p>
                {section.list && (
                  <ul className="space-y-3 ml-6 list-disc">
                    {section.list.map((item, itemIndex) => (
                      <li
                        key={itemIndex}
                        className="text-primary dark:text-gray-300 leading-relaxed"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          <p>
            Si tiene preguntas sobre esta política, puede{' '}
            <Link
              href="/contact"
              className="text-primary dark:text-accent hover:underline"
            >
              contactarnos
            </Link>
            .
          </p>
        </motion.div>
      </div>
    </div>
  );
}

