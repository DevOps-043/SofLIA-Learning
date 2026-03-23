'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar, Zap, HelpCircle, Volume2, VolumeX } from 'lucide-react';
import Image from 'next/image';
import { GoogleIcon, MicrosoftIcon } from '../icons/PlannerIcons';

interface StudyPlannerHeaderProps {
  connectedCalendar: string | null;
  isProcessing: boolean;
  showCalendarModal: boolean;
  isMobile: boolean;
  hoveredButton: string | null;
  isAudioEnabled: boolean;
  onBack: () => void;
  onOpenCalendarModal: () => void;
  onSetHoveredButton: (button: string | null) => void;
  onRestartTour: () => void;
  onHelp: () => void;
  onToggleAudio: () => void;
}

export function StudyPlannerHeader({
  connectedCalendar,
  isProcessing,
  showCalendarModal,
  isMobile,
  hoveredButton,
  isAudioEnabled,
  onBack,
  onOpenCalendarModal,
  onSetHoveredButton,
  onRestartTour,
  onHelp,
  onToggleAudio,
}: StudyPlannerHeaderProps) {
  return (
    <div id="lia-planner-header" className="flex-shrink-0 z-10 bg-white dark:bg-[#0F1419] backdrop-blur-xl border-b border-[#E9ECEF] dark:border-[#6C757D]/30 px-3 py-3 sm:px-4 sm:py-4">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <motion.button
            onClick={onBack}
            whileHover={{ scale: 1.1, x: -2 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-full text-[#6C757D] dark:text-gray-400 hover:text-[#0A2540] dark:hover:text-white hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20 transition-all mr-1"
            title="Volver al panel"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </motion.button>

          <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-[#0A2540]/20 dark:border-[#00D4B3]/30 flex-shrink-0">
            <Image
              src="/lia-avatar.png"
              alt="SofLIA"
              fill
              sizes="48px"
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-[#0A2540] dark:text-white truncate">SofLIA - Planificador</h1>
            <p className="text-xs sm:text-sm text-[#6C757D] dark:text-gray-400 truncate">Tu asistente personal</p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 no-scrollbar mask-gradient-right">
          {/* Botón Calendario conectado / Conectar calendario */}
          {connectedCalendar ? (
            <motion.button
              id="lia-calendar-button"
              layout
              onClick={onOpenCalendarModal}
              disabled={isProcessing}
              onMouseEnter={() => !isMobile && onSetHoveredButton('calendar-connected')}
              onMouseLeave={() => !isMobile && onSetHoveredButton(null)}
              whileTap={{ scale: 0.95 }}
              className={`rounded-lg transition-colors p-2 sm:p-2.5 flex-shrink-0 flex items-center justify-center disabled:opacity-50 bg-white/10 hover:bg-white/20 border border-white/20 ${isProcessing ? 'cursor-not-allowed' : ''
                }`}
            >
              <div className="flex items-center justify-center">
                {connectedCalendar === 'google' ? <GoogleIcon /> : <MicrosoftIcon />}
              </div>
              <AnimatePresence>
                {(hoveredButton === 'calendar-connected' && !isMobile) && (
                  <motion.span
                    initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                    animate={{ width: 'auto', opacity: 1, marginLeft: 8 }}
                    exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="whitespace-nowrap text-sm font-medium text-white overflow-hidden inline-block"
                  >
                    {connectedCalendar === 'google' ? 'Google' : 'Microsoft'} conectado
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          ) : (
            <motion.button
              id="lia-calendar-button"
              layout
              onClick={onOpenCalendarModal}
              disabled={isProcessing || showCalendarModal}
              onMouseEnter={() => !isMobile && onSetHoveredButton('calendar')}
              onMouseLeave={() => !isMobile && onSetHoveredButton(null)}
              whileTap={{ scale: 0.95 }}
              className={`rounded-lg transition-colors p-2 sm:p-2.5 flex-shrink-0 flex items-center disabled:opacity-50 ${isProcessing || showCalendarModal
                ? 'bg-[#6C757D] text-gray-400 cursor-not-allowed'
                : 'bg-[#0A2540]/10 dark:bg-[#0A2540]/20 hover:bg-[#0A2540]/20 dark:hover:bg-[#0A2540]/30 text-[#0A2540] dark:text-[#00D4B3] border border-[#0A2540]/20 dark:border-[#00D4B3]/30'
                }`}
            >
              <Calendar size={20} />
              <AnimatePresence>
                {(hoveredButton === 'calendar' && !isMobile) && (
                  <motion.span
                    initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                    animate={{ width: 'auto', opacity: 1, marginLeft: 8 }}
                    exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="whitespace-nowrap text-sm font-medium overflow-hidden inline-block"
                  >
                    Conectar calendario
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          )}

          {/* Botón Iniciar Tour */}
          <motion.button
            layout
            onClick={onRestartTour}
            disabled={isProcessing}
            onMouseEnter={() => !isMobile && onSetHoveredButton('tour')}
            onMouseLeave={() => !isMobile && onSetHoveredButton(null)}
            whileTap={{ scale: 0.95 }}
            className={`rounded-lg transition-colors p-2 sm:p-2.5 flex-shrink-0 flex items-center disabled:opacity-50 ${isProcessing
              ? 'bg-[#6C757D] text-gray-400 cursor-not-allowed'
              : 'bg-[#E9ECEF] dark:bg-[#0A2540]/10 hover:bg-[#E9ECEF]/80 dark:hover:bg-[#0A2540]/20 text-[#0A2540] dark:text-white border border-[#E9ECEF] dark:border-[#6C757D]/30'
              }`}
          >
            <Zap size={20} />
            <AnimatePresence>
              {(hoveredButton === 'tour' && !isMobile) && (
                <motion.span
                  initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                  animate={{ width: 'auto', opacity: 1, marginLeft: 8 }}
                  exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="whitespace-nowrap text-sm font-medium overflow-hidden inline-block"
                >
                  Ver Tour
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Botón ¿Cómo funciona? */}
          <motion.button
            layout
            onClick={onHelp}
            disabled={isProcessing}
            onMouseEnter={() => !isMobile && onSetHoveredButton('help')}
            onMouseLeave={() => !isMobile && onSetHoveredButton(null)}
            whileTap={{ scale: 0.95 }}
            className={`rounded-lg transition-colors p-2 sm:p-2.5 flex-shrink-0 flex items-center disabled:opacity-50 ${isProcessing
              ? 'bg-[#6C757D] text-gray-400 cursor-not-allowed'
              : 'bg-[#E9ECEF] dark:bg-[#0A2540]/10 hover:bg-[#E9ECEF]/80 dark:hover:bg-[#0A2540]/20 text-[#0A2540] dark:text-white border border-[#E9ECEF] dark:border-[#6C757D]/30'
              }`}
          >
            <HelpCircle size={20} />
            <AnimatePresence>
              {(hoveredButton === 'help' && !isMobile) && (
                <motion.span
                  initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                  animate={{ width: 'auto', opacity: 1, marginLeft: 8 }}
                  exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="whitespace-nowrap text-sm font-medium overflow-hidden inline-block"
                >
                  ¿Cómo funciona?
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Botón de audio */}
          <motion.button
            layout
            onClick={onToggleAudio}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-2 sm:p-2.5 rounded-lg transition-colors flex-shrink-0 ${isAudioEnabled
              ? 'bg-[#0A2540] dark:bg-[#0A2540] text-white hover:bg-[#0d2f4d] dark:hover:bg-[#0d2f4d]'
              : 'bg-[#E9ECEF] dark:bg-[#6C757D] text-[#6C757D] dark:text-gray-400 hover:bg-[#6C757D]/20 dark:hover:bg-[#6C757D]/80'
              }`}
          >
            {isAudioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
