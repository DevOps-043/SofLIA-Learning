'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Check, Zap, Scale, Clock } from 'lucide-react';

type StudyApproach = 'corto' | 'balance' | 'largo';

interface StudyApproachModalProps {
  show: boolean;
  studyApproach: StudyApproach | null;
  onSelect: (approach: StudyApproach) => void;
}

export function StudyApproachModal({ show, studyApproach, onSelect }: StudyApproachModalProps) {
  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9998]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
          >
            <motion.div
              className="relative bg-white dark:bg-[#1E2329] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="relative p-5 pb-4 border-b border-[#E9ECEF] dark:border-[#6C757D]/30 bg-[#0A2540]/5 dark:bg-[#0A2540]/10">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-[#0A2540]/10 dark:bg-[#0A2540]/20 rounded-lg border border-[#0A2540]/20 dark:border-[#00D4B3]/30">
                    <BookOpen className="w-5 h-5 text-[#0A2540] dark:text-[#00D4B3]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-[#0A2540] dark:text-white mb-1">¿Qué duración de sesión prefieres?</h3>
                    <p className="text-[#6C757D] dark:text-gray-400 text-xs">Elige la duración que mejor se adapte a tu disponibilidad</p>
                  </div>
                </div>
              </div>

              {/* Opciones de enfoque */}
              <div className="p-6 space-y-4">
                {/* Opción: Terminar rápido */}
                <motion.button
                  onClick={() => onSelect('corto')}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${studyApproach === 'corto'
                    ? 'bg-[#0A2540]/10 dark:bg-[#0A2540]/20 border-[#0A2540]/30 dark:border-[#00D4B3]/30 shadow-sm'
                    : 'bg-[#E9ECEF]/30 dark:bg-[#0A2540]/5 border-[#E9ECEF] dark:border-[#6C757D]/30 hover:border-[#0A2540]/50 dark:hover:border-[#00D4B3]/50 hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A2540]/10'
                    }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${studyApproach === 'corto'
                      ? 'bg-[#0A2540]/10 dark:bg-[#0A2540]/20'
                      : 'bg-[#E9ECEF] dark:bg-[#6C757D]/30'
                      }`}>
                      <Zap className="w-5 h-5 text-[#0A2540] dark:text-[#00D4B3]" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-[#0A2540] dark:text-white mb-1">Terminar rápido</h4>
                      <p className="text-xs text-[#6C757D] dark:text-gray-300">Sesiones largas para avanzar más cada día y terminar antes</p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-[#6C757D] dark:text-gray-400">
                        <span>- 60-90 min por sesión</span>
                        <span>- Descansos de 15 min</span>
                      </div>
                    </div>
                    {studyApproach === 'corto' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 rounded-full bg-[#0A2540] dark:bg-[#0A2540] flex items-center justify-center"
                      >
                        <Check className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </div>
                </motion.button>

                {/* Opción: Sesiones Equilibradas */}
                <motion.button
                  onClick={() => onSelect('balance')}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${studyApproach === 'balance'
                    ? 'bg-[#0A2540]/10 dark:bg-[#0A2540]/20 border-[#0A2540]/30 dark:border-[#00D4B3]/30 shadow-sm'
                    : 'bg-[#E9ECEF]/30 dark:bg-[#0A2540]/5 border-[#E9ECEF] dark:border-[#6C757D]/30 hover:border-[#0A2540]/50 dark:hover:border-[#00D4B3]/50 hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A2540]/10'
                    }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${studyApproach === 'balance'
                      ? 'bg-[#0A2540]/10 dark:bg-[#0A2540]/20'
                      : 'bg-[#E9ECEF] dark:bg-[#6C757D]/30'
                      }`}>
                      <Scale className="w-5 h-5 text-[#0A2540] dark:text-[#00D4B3]" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-[#0A2540] dark:text-white mb-1">Sesiones equilibradas</h4>
                      <p className="text-xs text-[#6C757D] dark:text-gray-300">Distribución equilibrada para un ritmo cómodo y efectivo</p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-[#6C757D] dark:text-gray-400">
                        <span>- 45-60 min por sesión</span>
                        <span>- Recomendado</span>
                      </div>
                    </div>
                    {studyApproach === 'balance' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 rounded-full bg-[#0A2540] dark:bg-[#0A2540] flex items-center justify-center"
                      >
                        <Check className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </div>
                </motion.button>

                {/* Opción: Sin prisa */}
                <motion.button
                  onClick={() => onSelect('largo')}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${studyApproach === 'largo'
                    ? 'bg-[#0A2540]/10 dark:bg-[#0A2540]/20 border-[#0A2540]/30 dark:border-[#00D4B3]/30 shadow-sm'
                    : 'bg-[#E9ECEF]/30 dark:bg-[#0A2540]/5 border-[#E9ECEF] dark:border-[#6C757D]/30 hover:border-[#0A2540]/50 dark:hover:border-[#00D4B3]/50 hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A2540]/10'
                    }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${studyApproach === 'largo'
                      ? 'bg-[#0A2540]/10 dark:bg-[#0A2540]/20'
                      : 'bg-[#E9ECEF] dark:bg-[#6C757D]/30'
                      }`}>
                      <Clock className="w-5 h-5 text-[#0A2540] dark:text-[#00D4B3]" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-[#0A2540] dark:text-white mb-1">Sin prisa</h4>
                      <p className="text-xs text-[#6C757D] dark:text-gray-300">Sesiones cortas distribuidas para aprender a tu ritmo</p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-[#6C757D] dark:text-gray-400">
                        <span>- 20-35 min por sesión</span>
                        <span>- Descansos de 5 min</span>
                      </div>
                    </div>
                    {studyApproach === 'largo' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 rounded-full bg-[#0A2540] dark:bg-[#0A2540] flex items-center justify-center"
                      >
                        <Check className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </div>
                </motion.button>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-[#E9ECEF] dark:border-[#6C757D]/30 bg-white dark:bg-[#1E2329]">
                <p className="text-xs text-[#6C757D] dark:text-gray-400 text-center">
                  Esta selección determina qué tan rápido completarás el curso
                </p>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
