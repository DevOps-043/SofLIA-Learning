'use client';

import type { ReactNode } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface StudyPlannerTargetDateModalProps {
  isOpen: boolean;
  currentMonth: Date | null;
  selectedDate: Date | null;
  onMonthChange: (nextMonth: Date) => void;
  onSelectDate: (date: Date) => void;
  onSkip: () => void;
  onConfirm: () => void;
}

function buildCalendarDays(currentMonth: Date, selectedDate: Date | null, onSelectDate: (date: Date) => void) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();
  const days: ReactNode[] = [];

  for (let index = 0; index < startingDayOfWeek; index += 1) {
    days.push(<div key={`empty-${index}`} className="p-2" />);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const isPast =
      year < todayYear ||
      (year === todayYear && month < todayMonth) ||
      (year === todayYear && month === todayMonth && day < todayDay);
    const isSelected =
      selectedDate !== null &&
      new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()).getTime() ===
        new Date(year, month, day).getTime();

    days.push(
      <motion.button
        key={day}
        onClick={() => {
          if (!isPast) {
            onSelectDate(date);
          }
        }}
        disabled={isPast}
        whileHover={!isPast ? { scale: 1.1 } : {}}
        whileTap={!isPast ? { scale: 0.9 } : {}}
        className={`rounded-lg p-2 text-sm font-medium transition-all ${
          isPast
            ? 'cursor-not-allowed text-gray-500'
            : isSelected
              ? 'bg-primary text-white shadow-sm dark:bg-primary'
              : 'text-primary hover:bg-primary/10 hover:text-primary dark:text-gray-300 dark:hover:bg-primary/20 dark:hover:text-white'
        }`}
      >
        {day}
      </motion.button>,
    );
  }

  return days;
}

export function StudyPlannerTargetDateModal({
  isOpen,
  currentMonth,
  selectedDate,
  onMonthChange,
  onSelectDate,
  onSkip,
  onConfirm,
}: StudyPlannerTargetDateModalProps) {
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
            <motion.div className="pointer-events-auto relative w-full max-w-md overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-500/30 dark:bg-carbon-800">
              <div className="relative border-b border-gray-200 bg-primary/5 p-5 pb-4 dark:border-gray-500/30 dark:bg-primary/10">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg border border-primary/20 bg-primary/10 p-2.5 dark:border-accent/30 dark:bg-primary/20">
                    <Calendar className="h-5 w-5 text-primary dark:text-accent" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1 text-lg font-bold text-primary dark:text-white">Selecciona fecha estimada</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Elige cuando quieres terminar tus cursos</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <motion.button
                    onClick={() => {
                      if (!currentMonth) {
                        return;
                      }

                      onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="rounded-lg p-2 text-gray-500 transition-all hover:bg-gray-200 hover:text-primary dark:text-gray-400 dark:hover:bg-primary/20 dark:hover:text-white"
                  >
                    <ChevronLeft size={20} />
                  </motion.button>
                  <h4 className="text-base font-semibold text-primary dark:text-white">
                    {currentMonth ? currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) : 'Cargando...'}
                  </h4>
                  <motion.button
                    onClick={() => {
                      if (!currentMonth) {
                        return;
                      }

                      onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="rounded-lg p-2 text-gray-500 transition-all hover:bg-gray-200 hover:text-primary dark:text-gray-400 dark:hover:bg-primary/20 dark:hover:text-white"
                  >
                    <ChevronRight size={20} />
                  </motion.button>
                </div>

                <div className="mb-2 grid grid-cols-7 gap-1">
                  {['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map((day) => (
                    <div key={day} className="py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {currentMonth ? (
                    buildCalendarDays(currentMonth, selectedDate, onSelectDate)
                  ) : (
                    <div className="col-span-7 py-4 text-center text-gray-500 dark:text-gray-400">Cargando calendario...</div>
                  )}
                </div>

                {selectedDate && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 rounded-lg border border-primary/20 bg-primary/10 p-3 dark:border-accent/30 dark:bg-primary/20"
                  >
                    <p className="text-sm text-primary dark:text-gray-300">
                      <span className="font-semibold text-primary dark:text-accent">Fecha seleccionada:</span>{' '}
                      {selectedDate.toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </motion.div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-gray-200 bg-white px-5 py-4 dark:border-gray-500/30 dark:bg-carbon-800">
                <motion.button
                  onClick={onSkip}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 text-xs text-gray-500 transition-colors hover:text-primary dark:text-gray-400 dark:hover:text-white"
                >
                  Sin fecha especifica
                </motion.button>
                <motion.button
                  onClick={onConfirm}
                  disabled={!selectedDate}
                  whileHover={selectedDate ? { scale: 1.05 } : {}}
                  whileTap={selectedDate ? { scale: 0.95 } : {}}
                  className={`rounded-md px-5 py-2 text-xs font-semibold transition-all ${
                    selectedDate
                      ? 'bg-primary text-white shadow-sm hover:bg-primary dark:bg-primary dark:hover:bg-primary'
                      : 'cursor-not-allowed bg-gray-500 text-gray-400'
                  }`}
                >
                  Confirmar
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
