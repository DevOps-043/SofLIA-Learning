'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ReportForm } from './ReportForm';
import { ReportModalHeader } from './ReportModalHeader';
import { SuccessScreen } from './SuccessScreen';
import { useProblemReportForm } from './useProblemReportForm';
import type { ReporteProblemProps } from './types';

export function ReporteProblema({
  fromLia = false,
  isOpen,
  onClose,
  preselectedCategory,
  reportContext,
}: ReporteProblemProps) {
  const form = useProblemReportForm({ fromLia, isOpen, onClose, preselectedCategory, reportContext });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        data-reporte-modal
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <motion.div
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-[#E9ECEF] bg-white shadow-2xl dark:border-[#6C757D]/30 dark:bg-[#1E2329]"
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
        >
          <ReportModalHeader isSubmitting={form.isSubmitting} onClose={onClose} step={form.step} />
          <div className="scrollbar-hide max-h-[calc(90vh-140px)] overflow-y-auto p-6">
            {form.step === 'form' ? <ReportForm form={form} onClose={onClose} /> : <SuccessScreen onClose={onClose} />}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
