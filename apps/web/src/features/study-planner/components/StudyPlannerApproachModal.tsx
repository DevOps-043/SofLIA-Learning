'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Check, Clock, Scale, Zap, type LucideIcon } from 'lucide-react';

import { STUDY_APPROACH_OPTIONS } from '../constants/studyApproachOptions';
import type { StudyApproach } from '../types/planner-ui.types';

interface StudyPlannerApproachModalProps {
  isOpen: boolean;
  selectedApproach: StudyApproach | null;
  onSelect: (approach: StudyApproach) => void;
}

function getApproachIcon(approach: StudyApproach): LucideIcon {
  switch (approach) {
    case 'corto':
      return Zap;
    case 'balance':
      return Scale;
    case 'largo':
      return Clock;
  }
}

export function StudyPlannerApproachModal({
  isOpen,
  selectedApproach,
  onSelect,
}: StudyPlannerApproachModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center p-4"
          >
            <motion.div className="pointer-events-auto relative w-full max-w-lg overflow-hidden rounded-xl border border-[#E9ECEF] bg-white shadow-2xl dark:border-[#6C757D]/30 dark:bg-[#1E2329]">
              <div className="relative border-b border-[#E9ECEF] bg-[#0A2540]/5 p-5 pb-4 dark:border-[#6C757D]/30 dark:bg-[#0A2540]/10">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg border border-[#0A2540]/20 bg-[#0A2540]/10 p-2.5 dark:border-[#00D4B3]/30 dark:bg-[#0A2540]/20">
                    <BookOpen className="h-5 w-5 text-[#0A2540] dark:text-[#00D4B3]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1 text-lg font-bold text-[#0A2540] dark:text-white">Que duracion de sesion prefieres?</h3>
                    <p className="text-xs text-[#6C757D] dark:text-gray-400">
                      Elige la duracion que mejor se adapte a tu disponibilidad
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-6">
                {STUDY_APPROACH_OPTIONS.map((option) => {
                  const isSelected = selectedApproach === option.value;
                  const Icon = getApproachIcon(option.value);

                  return (
                    <motion.button
                      key={option.value}
                      onClick={() => onSelect(option.value)}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                        isSelected
                          ? 'border-[#0A2540]/30 bg-[#0A2540]/10 shadow-sm dark:border-[#00D4B3]/30 dark:bg-[#0A2540]/20'
                          : 'border-[#E9ECEF] bg-[#E9ECEF]/30 hover:border-[#0A2540]/50 hover:bg-[#E9ECEF]/50 dark:border-[#6C757D]/30 dark:bg-[#0A2540]/5 dark:hover:border-[#00D4B3]/50 dark:hover:bg-[#0A2540]/10'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`rounded-lg p-2 ${
                            isSelected ? 'bg-[#0A2540]/10 dark:bg-[#0A2540]/20' : 'bg-[#E9ECEF] dark:bg-[#6C757D]/30'
                          }`}
                        >
                          <Icon className="h-5 w-5 text-[#0A2540] dark:text-[#00D4B3]" />
                        </div>

                        <div className="flex-1">
                          <h4 className="mb-1 text-base font-semibold text-[#0A2540] dark:text-white">{option.title}</h4>
                          <p className="text-xs text-[#6C757D] dark:text-gray-300">{option.description}</p>
                          <div className="mt-2 flex items-center gap-2 text-xs text-[#6C757D] dark:text-gray-400">
                            <span>- {option.sessionRange}</span>
                            <span>- {option.supportingCopy}</span>
                          </div>
                        </div>

                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0A2540] dark:bg-[#0A2540]"
                          >
                            <Check className="h-4 w-4 text-white" />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <div className="border-t border-[#E9ECEF] bg-white px-5 py-4 dark:border-[#6C757D]/30 dark:bg-[#1E2329]">
                <p className="text-center text-xs text-[#6C757D] dark:text-gray-400">
                  Esta seleccion determina que tan rapido completaras el curso
                </p>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
