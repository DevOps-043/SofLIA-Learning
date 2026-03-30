'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

import { CalendarSelectionPanel } from './CalendarSelection';
import type { StudyPlannerCalendarProvider } from '../types/planner-ui.types';

interface StudyPlannerCalendarConfigModalProps {
  isOpen: boolean;
  provider: StudyPlannerCalendarProvider;
  onClose: () => void;
  onSaveSuccess: () => void;
}

export function StudyPlannerCalendarConfigModal({
  isOpen,
  provider,
  onClose,
  onSaveSuccess,
}: StudyPlannerCalendarConfigModalProps) {
  if (!provider) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center p-4"
          >
            <motion.div className="pointer-events-auto relative w-full max-w-md overflow-hidden rounded-xl border border-[#E9ECEF] bg-white shadow-2xl dark:border-[#6C757D]/30 dark:bg-[#1E2329]">
              <div className="flex items-center justify-between border-b border-[#E9ECEF] p-4 dark:border-[#6C757D]/30">
                <div>
                  <h3 className="text-lg font-bold text-[#0A2540] dark:text-white">Configurar calendarios</h3>
                  <p className="mt-0.5 text-xs text-[#6C757D] dark:text-gray-400">
                    Selecciona que calendarios considerar para tu disponibilidad
                  </p>
                </div>
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="rounded-lg p-2 text-[#6C757D] transition-all hover:bg-[#E9ECEF] hover:text-[#0A2540] dark:text-gray-400 dark:hover:bg-[#0A2540]/20 dark:hover:text-white"
                >
                  <X size={18} />
                </motion.button>
              </div>

              <div className="p-4">
                <CalendarSelectionPanel provider={provider} onSaveSuccess={onSaveSuccess} />
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
