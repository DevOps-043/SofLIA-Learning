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
            ? 'cursor-not-allowed text-[#6C757D]'
            : isSelected
              ? 'bg-[#0A2540] text-white shadow-sm dark:bg-[#0A2540]'
              : 'text-[#0A2540] hover:bg-[#0A2540]/10 hover:text-[#0A2540] dark:text-gray-300 dark:hover:bg-[#0A2540]/20 dark:hover:text-white'
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
            <motion.div className="pointer-events-auto relative w-full max-w-md overflow-hidden rounded-xl border border-[#E9ECEF] bg-white shadow-2xl dark:border-[#6C757D]/30 dark:bg-[#1E2329]">
              <div className="relative border-b border-[#E9ECEF] bg-[#0A2540]/5 p-5 pb-4 dark:border-[#6C757D]/30 dark:bg-[#0A2540]/10">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg border border-[#0A2540]/20 bg-[#0A2540]/10 p-2.5 dark:border-[#00D4B3]/30 dark:bg-[#0A2540]/20">
                    <Calendar className="h-5 w-5 text-[#0A2540] dark:text-[#00D4B3]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1 text-lg font-bold text-[#0A2540] dark:text-white">Selecciona fecha estimada</h3>
                    <p className="text-xs text-[#6C757D] dark:text-gray-400">Elige cuando quieres terminar tus cursos</p>
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
                    className="rounded-lg p-2 text-[#6C757D] transition-all hover:bg-[#E9ECEF] hover:text-[#0A2540] dark:text-gray-400 dark:hover:bg-[#0A2540]/20 dark:hover:text-white"
                  >
                    <ChevronLeft size={20} />
                  </motion.button>
                  <h4 className="text-base font-semibold text-[#0A2540] dark:text-white">
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
                    className="rounded-lg p-2 text-[#6C757D] transition-all hover:bg-[#E9ECEF] hover:text-[#0A2540] dark:text-gray-400 dark:hover:bg-[#0A2540]/20 dark:hover:text-white"
                  >
                    <ChevronRight size={20} />
                  </motion.button>
                </div>

                <div className="mb-2 grid grid-cols-7 gap-1">
                  {['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map((day) => (
                    <div key={day} className="py-2 text-center text-xs font-semibold text-[#6C757D] dark:text-gray-400">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {currentMonth ? (
                    buildCalendarDays(currentMonth, selectedDate, onSelectDate)
                  ) : (
                    <div className="col-span-7 py-4 text-center text-[#6C757D] dark:text-gray-400">Cargando calendario...</div>
                  )}
                </div>

                {selectedDate && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 rounded-lg border border-[#0A2540]/20 bg-[#0A2540]/10 p-3 dark:border-[#00D4B3]/30 dark:bg-[#0A2540]/20"
                  >
                    <p className="text-sm text-[#0A2540] dark:text-gray-300">
                      <span className="font-semibold text-[#0A2540] dark:text-[#00D4B3]">Fecha seleccionada:</span>{' '}
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

              <div className="flex items-center justify-between gap-3 border-t border-[#E9ECEF] bg-white px-5 py-4 dark:border-[#6C757D]/30 dark:bg-[#1E2329]">
                <motion.button
                  onClick={onSkip}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 text-xs text-[#6C757D] transition-colors hover:text-[#0A2540] dark:text-gray-400 dark:hover:text-white"
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
                      ? 'bg-[#0A2540] text-white shadow-sm hover:bg-[#0d2f4d] dark:bg-[#0A2540] dark:hover:bg-[#0d2f4d]'
                      : 'cursor-not-allowed bg-[#6C757D] text-gray-400'
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
