'use client';

import { AnimatePresence, motion } from 'framer-motion';

interface StudyPlannerDashboardConfirmDialogProps {
  isDeletingPlan: boolean;
  isOpen: boolean;
  isRecreatingPlan: boolean;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function StudyPlannerDashboardConfirmDialog({
  isDeletingPlan,
  isOpen,
  isRecreatingPlan,
  message,
  onCancel,
  onConfirm,
}: StudyPlannerDashboardConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              onCancel();
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={(event) => event.stopPropagation()}
            className="bg-white dark:bg-[#1E2329] rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-[#E9ECEF] dark:border-[#6C757D]/30"
          >
            <div className="px-5 py-4 border-b border-[#E9ECEF] dark:border-[#6C757D]/30">
              <h3 className="text-base font-semibold text-[#0A2540] dark:text-white">
                Confirmar accion
              </h3>
            </div>

            <div className="px-5 py-4">
              <p className="text-sm text-[#6C757D] dark:text-gray-400">
                {message}
              </p>
            </div>

            <div className="px-5 py-4 border-t border-[#E9ECEF] dark:border-[#6C757D]/30 flex items-center justify-end gap-3">
              <button
                onClick={onCancel}
                disabled={isDeletingPlan || isRecreatingPlan}
                className="px-5 py-2 text-xs font-semibold text-[#6C757D] dark:text-gray-400 hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                disabled={isDeletingPlan || isRecreatingPlan}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(isDeletingPlan || isRecreatingPlan) ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {isDeletingPlan ? 'Eliminando...' : 'Procesando...'}
                  </>
                ) : (
                  'Confirmar'
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
