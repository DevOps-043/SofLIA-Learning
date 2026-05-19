'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Clock, Scale, Zap, type LucideIcon } from 'lucide-react';

import { STUDY_APPROACH_OPTIONS } from '../constants/studyApproachOptions';
import type { StudyApproach } from '../types/planner-ui.types';

interface StudyPlannerApproachButtonsProps {
  isVisible: boolean;
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

export function StudyPlannerApproachButtons({
  isVisible,
  selectedApproach,
  onSelect,
}: StudyPlannerApproachButtonsProps) {
  return (
    <AnimatePresence>
      {isVisible && !selectedApproach && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.2 }}
          className="group mt-2 flex justify-start"
        >
          <div className="flex max-w-[85%] items-end gap-2 sm:max-w-[80%] sm:gap-2.5">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 15 }}
              className="relative hidden h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border-2 border-primary/30 shadow-lg shadow-primary/20 dark:border-accent/40 dark:shadow-accent/20 sm:block sm:h-10 sm:w-10"
            >
              <Image src="/lia-avatar.webp" alt="LIA" fill sizes="40px" className="object-cover" />
            </motion.div>

            <div className="relative mt-1 h-6 w-6 flex-shrink-0 self-start overflow-hidden rounded-full border border-primary/30 dark:border-accent/40 sm:hidden">
              <Image src="/lia-avatar.webp" alt="LIA" fill sizes="24px" className="object-cover" />
            </div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.35, type: 'spring', stiffness: 300, damping: 20 }}
              className="relative overflow-hidden rounded-[18px] rounded-bl-[6px] border border-gray-200 bg-white px-3.5 py-2.5 text-primary shadow-sm dark:border-gray-500/30 dark:bg-carbon-800 dark:text-white sm:rounded-[22px] sm:px-5 sm:py-3"
            >
              <div className="mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary dark:text-accent" />
                <p className="text-sm font-medium text-primary dark:text-white">Que ritmo de estudio prefieres?</p>
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-3">
                {STUDY_APPROACH_OPTIONS.map((option) => {
                  const Icon = getApproachIcon(option.value);
                  const isHighlighted = option.value === 'balance';

                  return (
                    <motion.button
                      key={option.value}
                      onClick={() => onSelect(option.value)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex min-w-[85px] flex-1 flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all ${
                        isHighlighted
                          ? 'border-primary/30 bg-primary/5 dark:border-accent/30 dark:bg-primary/10 dark:hover:bg-primary/20'
                          : 'border-gray-200 hover:border-primary/50 hover:bg-primary/5 dark:border-gray-500/30 dark:hover:border-accent/50 dark:hover:bg-primary/10'
                      }`}
                    >
                      <div className="rounded-lg bg-primary/10 p-2 dark:bg-primary/20">
                        <Icon className="h-4 w-4 text-primary dark:text-accent" />
                      </div>
                      <span className="text-xs font-semibold text-primary dark:text-white">{option.shortTitle}</span>
                      <span className="text-center text-[10px] text-gray-500 dark:text-gray-400">{option.sessionRange.replace(' por sesion', '')}</span>
                    </motion.button>
                  );
                })}
              </div>

              <p className="mt-3 text-center text-[10px] text-gray-500 dark:text-gray-400">Selecciona para continuar</p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
