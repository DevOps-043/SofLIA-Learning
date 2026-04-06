'use client';

import type { ReactNode } from 'react';

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar, HelpCircle, Settings, Volume2, VolumeX, Zap } from 'lucide-react';

import { StudyPlannerCalendarProviderIcon } from './StudyPlannerCalendarProviderIcon';
import type { StudyPlannerCalendarProvider } from '../types/planner-ui.types';

interface StudyPlannerConversationHeaderProps {
  isMobile: boolean;
  connectedCalendar: StudyPlannerCalendarProvider;
  isProcessing: boolean;
  selectedCourseName?: string | null;
  showCalendarModal: boolean;
  hoveredButton: string | null;
  hasConfiguredCalendars: boolean;
  isAudioEnabled: boolean;
  onBack: () => void;
  onHoverChange: (value: string | null) => void;
  onOpenCalendar: () => void;
  onOpenCalendarConfig: () => void;
  onRestartTour: () => void;
  onAskHowItWorks: () => void;
  onToggleAudio: () => void;
}

interface HeaderActionButtonProps {
  buttonId?: string;
  label: string;
  hoverKey: string;
  isMobile: boolean;
  hoveredButton: string | null;
  disabled?: boolean;
  className: string;
  onClick: () => void;
  onHoverChange: (value: string | null) => void;
  children: ReactNode;
  badge?: ReactNode;
}

function HeaderActionButton({
  buttonId,
  label,
  hoverKey,
  isMobile,
  hoveredButton,
  disabled,
  className,
  onClick,
  onHoverChange,
  children,
  badge,
}: HeaderActionButtonProps) {
  return (
    <motion.button
      id={buttonId}
      layout
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => !isMobile && onHoverChange(hoverKey)}
      onMouseLeave={() => !isMobile && onHoverChange(null)}
      whileTap={{ scale: 0.95 }}
      className={className}
    >
      {children}
      {badge}
      <AnimatePresence>
        {hoveredButton === hoverKey && !isMobile && (
          <motion.span
            initial={{ width: 0, opacity: 0, marginLeft: 0 }}
            animate={{ width: 'auto', opacity: 1, marginLeft: 8 }}
            exit={{ width: 0, opacity: 0, marginLeft: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="inline-block overflow-hidden whitespace-nowrap text-sm font-medium"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export function StudyPlannerConversationHeader({
  isMobile,
  connectedCalendar,
  isProcessing,
  selectedCourseName,
  showCalendarModal,
  hoveredButton,
  hasConfiguredCalendars,
  isAudioEnabled,
  onBack,
  onHoverChange,
  onOpenCalendar,
  onOpenCalendarConfig,
  onRestartTour,
  onAskHowItWorks,
  onToggleAudio,
}: StudyPlannerConversationHeaderProps) {
  return (
    <div
      id="lia-planner-header"
      className="z-10 flex-shrink-0 border-b border-[#E9ECEF] bg-white px-3 py-3 backdrop-blur-xl dark:border-[#6C757D]/30 dark:bg-[#0F1419] sm:px-4 sm:py-4"
    >
      <div className="mx-auto flex max-w-4xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-3">
          <motion.button
            onClick={onBack}
            whileHover={{ scale: 1.1, x: -2 }}
            whileTap={{ scale: 0.9 }}
            className="mr-1 rounded-full p-2 text-[#6C757D] transition-all hover:bg-[#E9ECEF] hover:text-[#0A2540] dark:text-gray-400 dark:hover:bg-[#0A2540]/20 dark:hover:text-white"
            title="Volver al panel"
          >
            <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </motion.button>

          <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border-2 border-[#0A2540]/20 dark:border-[#00D4B3]/30 sm:h-12 sm:w-12">
            <Image src="/lia-avatar.png" alt="LIA" fill sizes="48px" className="object-cover" />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-bold text-[#0A2540] dark:text-white sm:text-lg">SofLIA - Planificador</h1>
            {selectedCourseName ? (
              <p className="flex items-center gap-1.5 truncate text-xs text-[#0A2540] dark:text-[#00D4B3] sm:text-sm">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {selectedCourseName}
              </p>
            ) : (
              <p className="truncate text-xs text-[#6C757D] dark:text-gray-400 sm:text-sm">Tu asistente personal</p>
            )}
          </div>
        </div>

        <div className="mask-gradient-right no-scrollbar flex w-full items-center gap-2 overflow-x-auto pb-1 sm:w-auto sm:pb-0">
          {connectedCalendar ? (
            <HeaderActionButton
              buttonId="lia-calendar-button"
              label={`${connectedCalendar === 'google' ? 'Google' : 'Microsoft'} conectado`}
              hoverKey="calendar-connected"
              isMobile={isMobile}
              hoveredButton={hoveredButton}
              disabled={isProcessing}
              onClick={onOpenCalendar}
              onHoverChange={onHoverChange}
              className={`flex flex-shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 p-2 transition-colors disabled:opacity-50 sm:p-2.5 ${
                isProcessing ? 'cursor-not-allowed' : 'hover:bg-white/20'
              }`}
            >
              <div className="flex items-center justify-center">
                <StudyPlannerCalendarProviderIcon provider={connectedCalendar} className="h-5 w-5" />
              </div>
            </HeaderActionButton>
          ) : (
            <HeaderActionButton
              buttonId="lia-calendar-button"
              label="Conectar calendario"
              hoverKey="calendar"
              isMobile={isMobile}
              hoveredButton={hoveredButton}
              disabled={isProcessing || showCalendarModal}
              onClick={onOpenCalendar}
              onHoverChange={onHoverChange}
              className={`flex flex-shrink-0 items-center rounded-lg p-2 transition-colors disabled:opacity-50 sm:p-2.5 ${
                isProcessing || showCalendarModal
                  ? 'cursor-not-allowed bg-[#6C757D] text-gray-400'
                  : 'border border-[#0A2540]/20 bg-[#0A2540]/10 text-[#0A2540] hover:bg-[#0A2540]/20 dark:border-[#00D4B3]/30 dark:bg-[#0A2540]/20 dark:text-[#00D4B3] dark:hover:bg-[#0A2540]/30'
              }`}
            >
              <Calendar size={20} />
            </HeaderActionButton>
          )}

          <HeaderActionButton
            label="Configurar calendarios"
            hoverKey="calendar-config"
            isMobile={isMobile}
            hoveredButton={hoveredButton}
            disabled={!connectedCalendar || isProcessing}
            onClick={onOpenCalendarConfig}
            onHoverChange={onHoverChange}
            className={`relative flex flex-shrink-0 items-center rounded-lg p-2 transition-colors disabled:opacity-50 sm:p-2.5 ${
              !connectedCalendar || isProcessing
                ? 'cursor-not-allowed bg-[#6C757D]/50 text-gray-400'
                : 'border border-[#E9ECEF] bg-[#E9ECEF] text-[#0A2540] hover:bg-[#E9ECEF]/80 dark:border-[#6C757D]/30 dark:bg-[#0A2540]/10 dark:text-white dark:hover:bg-[#0A2540]/20'
            }`}
          >
            <Settings size={20} />
            {connectedCalendar && !hasConfiguredCalendars && (
              <span className="absolute -right-1 -top-1 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500" />
              </span>
            )}
          </HeaderActionButton>

          <HeaderActionButton
            label="Ver Tour"
            hoverKey="tour"
            isMobile={isMobile}
            hoveredButton={hoveredButton}
            disabled={isProcessing}
            onClick={onRestartTour}
            onHoverChange={onHoverChange}
            className={`flex flex-shrink-0 items-center rounded-lg p-2 transition-colors disabled:opacity-50 sm:p-2.5 ${
              isProcessing
                ? 'cursor-not-allowed bg-[#6C757D] text-gray-400'
                : 'border border-[#E9ECEF] bg-[#E9ECEF] text-[#0A2540] hover:bg-[#E9ECEF]/80 dark:border-[#6C757D]/30 dark:bg-[#0A2540]/10 dark:text-white dark:hover:bg-[#0A2540]/20'
            }`}
          >
            <Zap size={20} />
          </HeaderActionButton>

          <HeaderActionButton
            label="Como funciona?"
            hoverKey="help"
            isMobile={isMobile}
            hoveredButton={hoveredButton}
            disabled={isProcessing}
            onClick={onAskHowItWorks}
            onHoverChange={onHoverChange}
            className={`flex flex-shrink-0 items-center rounded-lg p-2 transition-colors disabled:opacity-50 sm:p-2.5 ${
              isProcessing
                ? 'cursor-not-allowed bg-[#6C757D] text-gray-400'
                : 'border border-[#E9ECEF] bg-[#E9ECEF] text-[#0A2540] hover:bg-[#E9ECEF]/80 dark:border-[#6C757D]/30 dark:bg-[#0A2540]/10 dark:text-white dark:hover:bg-[#0A2540]/20'
            }`}
          >
            <HelpCircle size={20} />
          </HeaderActionButton>

          <motion.button
            layout
            onClick={onToggleAudio}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex-shrink-0 rounded-lg p-2 transition-colors sm:p-2.5 ${
              isAudioEnabled
                ? 'bg-[#0A2540] text-white hover:bg-[#0d2f4d] dark:bg-[#0A2540] dark:hover:bg-[#0d2f4d]'
                : 'bg-[#E9ECEF] text-[#6C757D] hover:bg-[#6C757D]/20 dark:bg-[#6C757D] dark:text-gray-400 dark:hover:bg-[#6C757D]/80'
            }`}
          >
            {isAudioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
