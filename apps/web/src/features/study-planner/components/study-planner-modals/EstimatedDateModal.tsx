'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface EstimatedDateModalProps {
  show: boolean;
  currentMonth: Date | null;
  selectedDate: Date | null;
  onMonthChange: (date: Date) => void;
  onDateSelect: (date: Date) => void;
  onConfirm: (date: Date | null, skip?: boolean) => void;
}

export function EstimatedDateModal({
  show,
  currentMonth,
  selectedDate,
  onMonthChange,
  onDateSelect,
  onConfirm,
}: EstimatedDateModalProps) {
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
              className="relative bg-white dark:bg-[#1E2329] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl shadow-2xl w-full max-w-md overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="relative p-5 pb-4 border-b border-[#E9ECEF] dark:border-[#6C757D]/30 bg-[#0A2540]/5 dark:bg-[#0A2540]/10">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-[#0A2540]/10 dark:bg-[#0A2540]/20 rounded-lg border border-[#0A2540]/20 dark:border-[#00D4B3]/30">
                    <Calendar className="w-5 h-5 text-[#0A2540] dark:text-[#00D4B3]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-[#0A2540] dark:text-white mb-1">Selecciona fecha estimada</h3>
                    <p className="text-[#6C757D] dark:text-gray-400 text-xs">Elige cuándo quieres terminar tus cursos</p>
                  </div>
                </div>
              </div>

              {/* Calendario */}
              <div className="p-6">
                {/* Navegación del mes */}
                <div className="flex items-center justify-between mb-4">
                  <motion.button
                    onClick={() => {
                      if (!currentMonth) return;
                      const year = currentMonth.getFullYear();
                      const month = currentMonth.getMonth();
                      onMonthChange(new Date(year, month - 1, 1));
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 text-[#6C757D] dark:text-gray-400 hover:text-[#0A2540] dark:hover:text-white hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20 rounded-lg transition-all"
                  >
                    <ChevronLeft size={20} />
                  </motion.button>
                  <h4 className="text-base font-semibold text-[#0A2540] dark:text-white">
                    {currentMonth ? currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) : 'Cargando...'}
                  </h4>
                  <motion.button
                    onClick={() => {
                      if (!currentMonth) return;
                      const year = currentMonth.getFullYear();
                      const month = currentMonth.getMonth();
                      onMonthChange(new Date(year, month + 1, 1));
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 text-[#6C757D] dark:text-gray-400 hover:text-[#0A2540] dark:hover:text-white hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20 rounded-lg transition-all"
                  >
                    <ChevronRight size={20} />
                  </motion.button>
                </div>

                {/* Días de la semana */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day, idx) => (
                    <div key={idx} className="text-center text-xs font-semibold text-[#6C757D] dark:text-gray-400 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Días del mes */}
                <div className="grid grid-cols-7 gap-1">
                  {(() => {
                    if (!currentMonth) {
                      return <div className="col-span-7 text-center text-[#6C757D] dark:text-gray-400 py-4">Cargando calendario...</div>;
                    }

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

                    const days = [];

                    for (let i = 0; i < startingDayOfWeek; i++) {
                      days.push(<div key={`empty-${i}`} className="p-2"></div>);
                    }

                    for (let day = 1; day <= daysInMonth; day++) {
                      const isPast = year < todayYear ||
                        (year === todayYear && month < todayMonth) ||
                        (year === todayYear && month === todayMonth && day < todayDay);

                      let isSelected = false;
                      if (selectedDate) {
                        const selectedNormalized = new Date(
                          selectedDate.getFullYear(),
                          selectedDate.getMonth(),
                          selectedDate.getDate()
                        );
                        const dateNormalized = new Date(year, month, day);
                        isSelected = selectedNormalized.getTime() === dateNormalized.getTime();
                      }

                      days.push(
                        <motion.button
                          key={day}
                          onClick={() => {
                            if (!isPast) {
                              onDateSelect(new Date(year, month, day));
                            }
                          }}
                          disabled={isPast}
                          whileHover={!isPast ? { scale: 1.1 } : {}}
                          whileTap={!isPast ? { scale: 0.9 } : {}}
                          className={`p-2 rounded-lg text-sm font-medium transition-all ${isPast
                            ? 'text-[#6C757D] cursor-not-allowed'
                            : isSelected
                              ? 'bg-[#0A2540] dark:bg-[#0A2540] text-white shadow-sm'
                              : 'text-[#0A2540] dark:text-gray-300 hover:bg-[#0A2540]/10 dark:hover:bg-[#0A2540]/20 hover:text-[#0A2540] dark:hover:text-white'
                            }`}
                        >
                          {day}
                        </motion.button>
                      );
                    }

                    return days;
                  })()}
                </div>

                {/* Fecha seleccionada */}
                {selectedDate && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 bg-[#0A2540]/10 dark:bg-[#0A2540]/20 border border-[#0A2540]/20 dark:border-[#00D4B3]/30 rounded-lg"
                  >
                    <p className="text-sm text-[#0A2540] dark:text-gray-300">
                      <span className="text-[#0A2540] dark:text-[#00D4B3] font-semibold">Fecha seleccionada:</span>{' '}
                      {selectedDate.toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Footer con botones */}
              <div className="px-5 py-4 border-t border-[#E9ECEF] dark:border-[#6C757D]/30 bg-white dark:bg-[#1E2329] flex items-center justify-between gap-3">
                <motion.button
                  onClick={() => onConfirm(null, true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 text-xs text-[#6C757D] dark:text-gray-400 hover:text-[#0A2540] dark:hover:text-white transition-colors"
                >
                  Sin fecha específica
                </motion.button>
                <motion.button
                  onClick={() => selectedDate && onConfirm(selectedDate)}
                  disabled={!selectedDate}
                  whileHover={selectedDate ? { scale: 1.05 } : {}}
                  whileTap={selectedDate ? { scale: 0.95 } : {}}
                  className={`px-5 py-2 rounded-md text-xs font-semibold transition-all ${selectedDate
                    ? 'bg-[#0A2540] dark:bg-[#0A2540] hover:bg-[#0d2f4d] dark:hover:bg-[#0d2f4d] text-white shadow-sm'
                    : 'bg-[#6C757D] text-gray-400 cursor-not-allowed'
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
