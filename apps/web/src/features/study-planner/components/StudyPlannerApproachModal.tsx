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
            <motion.div className="pointer-events-auto relative w-full max-w-lg overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-500/30 dark:bg-carbon-800">
              <div className="relative border-b border-gray-200 bg-primary/5 p-5 pb-4 dark:border-gray-500/30 dark:bg-primary/10">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg border border-primary/20 bg-primary/10 p-2.5 dark:border-accent/30 dark:bg-primary/20">
                    <BookOpen className="h-5 w-5 text-primary dark:text-accent" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1 text-lg font-bold text-primary dark:text-white">Que duracion de sesion prefieres?</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
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
                          ? 'border-primary/30 bg-primary/10 shadow-sm dark:border-accent/30 dark:bg-primary/20'
                          : 'border-gray-200 bg-gray-200/30 hover:border-primary/50 hover:bg-gray-200/50 dark:border-gray-500/30 dark:bg-primary/5 dark:hover:border-accent/50 dark:hover:bg-primary/10'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`rounded-lg p-2 ${
                            isSelected ? 'bg-primary/10 dark:bg-primary/20' : 'bg-gray-200 dark:bg-gray-500/30'
                          }`}
                        >
                          <Icon className="h-5 w-5 text-primary dark:text-accent" />
                        </div>

                        <div className="flex-1">
                          <h4 className="mb-1 text-base font-semibold text-primary dark:text-white">{option.title}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-300">{option.description}</p>
                          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>- {option.sessionRange}</span>
                            <span>- {option.supportingCopy}</span>
                          </div>
                        </div>

                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex h-6 w-6 items-center justify-center rounded-full bg-primary dark:bg-primary"
                          >
                            <Check className="h-4 w-4 text-white" />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <div className="border-t border-gray-200 bg-white px-5 py-4 dark:border-gray-500/30 dark:bg-carbon-800">
                <p className="text-center text-xs text-gray-500 dark:text-gray-400">
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
