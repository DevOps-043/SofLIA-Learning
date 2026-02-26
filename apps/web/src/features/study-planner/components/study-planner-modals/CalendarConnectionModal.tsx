'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Loader2 } from 'lucide-react';
import { GoogleIcon } from '../icons/PlannerIcons';

interface CalendarConnectionModalProps {
  userType?: string;
  connectedCalendar: string | null;
  isConnectingCalendar: boolean;
  onConnect: (provider: 'google' | 'microsoft') => void;
  onSkip: () => void;
  onClose: () => void;
}

export function CalendarConnectionModal({
  userType,
  connectedCalendar,
  isConnectingCalendar,
  onConnect,
  onSkip,
  onClose,
}: CalendarConnectionModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
    >
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => {
          if (userType === 'b2b' && !connectedCalendar) {
            return;
          }
          onClose();
        }}
        style={{ cursor: (userType === 'b2b' && !connectedCalendar) ? 'default' : 'pointer' }}
      />

      {/* Modal */}
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="relative bg-white dark:bg-[#1E2329] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl p-5 max-w-md w-full shadow-2xl"
      >
        {/* Header */}
        <div className="text-center mb-5">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-16 h-16 mx-auto mb-3 rounded-xl bg-[#0A2540]/10 dark:bg-[#0A2540]/20 flex items-center justify-center shadow-sm border border-[#0A2540]/20 dark:border-[#00D4B3]/30"
          >
            <Calendar className="w-8 h-8 text-[#0A2540] dark:text-[#00D4B3]" />
          </motion.div>
          <h3 className="text-xl font-bold text-[#0A2540] dark:text-white mb-2">
            Conecta tu calendario
          </h3>
          <p className="text-[#6C757D] dark:text-gray-400 text-sm max-w-sm mx-auto">
            {userType === 'b2b'
              ? 'Como usuario empresarial, es necesario conectar tu calendario para adaptar el plan a tus horarios de trabajo y cumplir con los plazos asignados.'
              : 'Analizo tu calendario para encontrar los mejores horarios para estudiar'}
          </p>
        </div>

        {/* Opciones de calendario */}
        <div className="space-y-4 mb-6">
          {/* Google Calendar */}
          <div className="relative group">
            <motion.button
              onClick={() => onConnect('google')}
              disabled={isConnectingCalendar}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center gap-3 p-4 rounded-xl transition-all relative overflow-hidden bg-white dark:bg-[#0A2540]/20 border border-[#E9ECEF] dark:border-[#6C757D]/30 hover:border-blue-500 dark:hover:border-blue-500 shadow-sm hover:shadow-md"
            >
              {isConnectingCalendar && (
                <div className="absolute inset-0 bg-white/50 dark:bg-black/50 flex items-center justify-center z-10">
                  <Loader2 className="w-6 h-6 animate-spin text-[#0A2540] dark:text-white" />
                </div>
              )}
              <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm bg-white">
                <GoogleIcon />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[#0A2540] dark:text-white font-semibold text-sm">Google Calendar</p>
                </div>
                <p className="text-[#6C757D] dark:text-gray-400 text-xs">Conecta tu cuenta de Google</p>
              </div>
            </motion.button>
          </div>

          {/* Microsoft Calendar */}
          <div className="relative group">
            <motion.button
              onClick={() => onConnect('microsoft')}
              disabled={isConnectingCalendar}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center gap-3 p-4 rounded-xl transition-all relative overflow-hidden bg-white dark:bg-[#0A2540]/20 border border-[#E9ECEF] dark:border-[#6C757D]/30 hover:border-blue-500 dark:hover:border-blue-500 shadow-sm hover:shadow-md"
            >
              {isConnectingCalendar && (
                <div className="absolute inset-0 bg-white/50 dark:bg-black/50 flex items-center justify-center z-10">
                  <Loader2 className="w-6 h-6 animate-spin text-[#0A2540] dark:text-white" />
                </div>
              )}
              <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm bg-white">
                <svg viewBox="0 0 23 23" className="w-8 h-8">
                  <path fill="#f25022" d="M1 1h10v10H1z" />
                  <path fill="#00a4ef" d="M12 1h10v10H12z" />
                  <path fill="#7fba00" d="M1 12h10v10H1z" />
                  <path fill="#ffb900" d="M12 12h10v10H12z" />
                </svg>
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[#0A2540] dark:text-white font-semibold text-sm">Microsoft Outlook</p>
                </div>
                <p className="text-[#6C757D] dark:text-gray-400 text-xs">Conecta tu cuenta de Microsoft</p>
              </div>
            </motion.button>
          </div>
        </div>

        {/* Botón para saltar */}
        <div className="text-center pt-2">
          <motion.button
            onClick={onSkip}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-[#6C757D] dark:text-gray-400 hover:text-[#0A2540] dark:hover:text-white text-xs font-medium transition-colors px-4 py-2 rounded-md hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20"
          >
            Continuar sin calendario
          </motion.button>
        </div>

        {/* Botón cerrar */}
        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          className="absolute top-4 right-4 p-2 text-[#6C757D] dark:text-gray-400 hover:text-[#0A2540] dark:hover:text-white hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20 rounded-lg transition-all"
          title={connectedCalendar ? "Cerrar y continuar con calendario conectado" : "Cerrar modal"}
          aria-label="Cerrar"
        >
          <X size={20} />
        </motion.button>

        {/* Mensaje informativo */}
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-blue-400 text-xs text-center">
            💡 Conectar tu calendario permite adaptar el plan a tus horarios reales
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
