'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Settings, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CalendarSelectionPanel } from '../CalendarSelection';

interface StudyPlannerDashboardCalendarConfigModalProps {
  isOpen: boolean;
  onCalendarSelectionSaved: () => void;
  onClose: () => void;
  provider: 'google' | 'microsoft' | null;
  showOnlyPlanEvents: boolean;
  toggleShowOnlyPlanEvents: () => void;
}

export function StudyPlannerDashboardCalendarConfigModal({
  isOpen,
  onCalendarSelectionSaved,
  onClose,
  provider,
  showOnlyPlanEvents,
  toggleShowOnlyPlanEvents,
}: StudyPlannerDashboardCalendarConfigModalProps) {
  const { t } = useTranslation('common');
  const modalTitle = t('studyPlanner.calendarSelection.modalTitle', {
    defaultValue: 'Configuracion',
  });
  const planOnlyTitle = t('studyPlanner.calendarSelection.planOnlyTitle', {
    defaultValue: 'Solo eventos del plan',
  });
  const planOnlyDescription = t('studyPlanner.calendarSelection.planOnlyDescription', {
    defaultValue: 'Oculta eventos externos en el calendario',
  });
  const planOnlyAriaLabel = t('studyPlanner.calendarSelection.planOnlyAriaLabel', {
    defaultValue: 'Mostrar solo eventos del plan',
  });

  return (
    <AnimatePresence>
      {isOpen && provider && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="bg-white dark:bg-[#1E2329] rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-[#6C757D]/30">
              <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-[#6C757D]/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/10 dark:bg-accent/20">
                    <Settings className="w-5 h-5 text-accent" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {modalTitle}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-[#0A2540]/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <div className="p-5 space-y-5">
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-[#0A2540]/10 border border-gray-200 dark:border-[#6C757D]/20">
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {planOnlyTitle}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {planOnlyDescription}
                    </p>
                  </div>
                  <motion.button
                    onClick={toggleShowOnlyPlanEvents}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full focus:outline-none focus:ring-2 focus:ring-[#00D4B3] focus:ring-offset-2 cursor-pointer ${
                      showOnlyPlanEvents
                        ? 'bg-[#0A2540] dark:bg-[#0A2540]'
                        : 'bg-gray-300 dark:bg-[#6C757D]'
                    }`}
                    role="switch"
                    aria-checked={showOnlyPlanEvents}
                    aria-label={planOnlyAriaLabel}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.span
                      className="inline-block h-4 w-4 rounded-full bg-white shadow-md"
                      animate={{ x: showOnlyPlanEvents ? 22 : 4 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </motion.button>
                </div>

                <CalendarSelectionPanel
                  provider={provider}
                  onSaveSuccess={onCalendarSelectionSaved}
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
