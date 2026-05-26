'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, HelpCircle, Settings, Volume2, VolumeX } from 'lucide-react';

import { StudyPlannerCalendarProviderIcon } from './StudyPlannerCalendarProviderIcon';
import { StudyPlannerHeaderActionButton } from './StudyPlannerHeaderActionButton';
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
  onAskHowItWorks: () => void;
  onToggleAudio: () => void;
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
  onAskHowItWorks,
  onToggleAudio,
}: StudyPlannerConversationHeaderProps) {
  return (
    <div
      id="lia-planner-header"
      className="z-10 flex-shrink-0 border-b border-gray-200 bg-white px-3 py-3 backdrop-blur-xl dark:border-gray-500/30 dark:bg-carbon-900 sm:px-4 sm:py-4"
    >
      <div className="mx-auto flex max-w-4xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-3">
          <motion.button
            onClick={onBack}
            whileHover={{ scale: 1.1, x: -2 }}
            whileTap={{ scale: 0.9 }}
            className="mr-1 rounded-full p-2 text-gray-500 transition-all hover:bg-gray-200 hover:text-primary dark:text-gray-400 dark:hover:bg-primary/20 dark:hover:text-white"
            title="Volver al panel"
          >
            <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </motion.button>

          <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border-2 border-primary/20 dark:border-accent/30 sm:h-12 sm:w-12">
            <Image src="/lia-avatar.webp" alt="SofLIA" fill sizes="48px" className="object-cover" />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-bold text-primary dark:text-white sm:text-lg">SofLIA - Planificador</h1>
            {selectedCourseName ? (
              <p className="flex items-center gap-1.5 truncate text-xs text-primary dark:text-accent sm:text-sm">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {selectedCourseName}
              </p>
            ) : (
              <p className="truncate text-xs text-gray-500 dark:text-gray-400 sm:text-sm">Tu asistente personal</p>
            )}
          </div>
        </div>

        <div className="mask-gradient-right no-scrollbar flex w-full items-center gap-2 overflow-x-auto pb-1 sm:w-auto sm:pb-0">
          {connectedCalendar ? (
            <StudyPlannerHeaderActionButton
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
            </StudyPlannerHeaderActionButton>
          ) : (
            <StudyPlannerHeaderActionButton
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
                  ? 'cursor-not-allowed bg-gray-500 text-gray-400'
                  : 'border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 dark:border-accent/30 dark:bg-primary/20 dark:text-accent dark:hover:bg-primary/30'
              }`}
            >
              <Calendar size={20} />
            </StudyPlannerHeaderActionButton>
          )}

          <StudyPlannerHeaderActionButton
            label="Configurar calendarios"
            hoverKey="calendar-config"
            isMobile={isMobile}
            hoveredButton={hoveredButton}
            disabled={!connectedCalendar || isProcessing}
            onClick={onOpenCalendarConfig}
            onHoverChange={onHoverChange}
            className={`relative flex flex-shrink-0 items-center rounded-lg p-2 transition-colors disabled:opacity-50 sm:p-2.5 ${
              !connectedCalendar || isProcessing
                ? 'cursor-not-allowed bg-gray-500/50 text-gray-400'
                : 'border border-gray-200 bg-gray-200 text-primary hover:bg-gray-200/80 dark:border-gray-500/30 dark:bg-primary/10 dark:text-white dark:hover:bg-primary/20'
            }`}
          >
            <Settings size={20} />
            {connectedCalendar && !hasConfiguredCalendars && (
              <span className="absolute -right-1 -top-1 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500" />
              </span>
            )}
          </StudyPlannerHeaderActionButton>

          <StudyPlannerHeaderActionButton
            label="Como funciona?"
            hoverKey="help"
            isMobile={isMobile}
            hoveredButton={hoveredButton}
            disabled={isProcessing}
            onClick={onAskHowItWorks}
            onHoverChange={onHoverChange}
            className={`flex flex-shrink-0 items-center rounded-lg p-2 transition-colors disabled:opacity-50 sm:p-2.5 ${
              isProcessing
                ? 'cursor-not-allowed bg-gray-500 text-gray-400'
                : 'border border-gray-200 bg-gray-200 text-primary hover:bg-gray-200/80 dark:border-gray-500/30 dark:bg-primary/10 dark:text-white dark:hover:bg-primary/20'
            }`}
          >
            <HelpCircle size={20} />
          </StudyPlannerHeaderActionButton>

          <motion.button
            layout
            onClick={onToggleAudio}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex-shrink-0 rounded-lg p-2 transition-colors sm:p-2.5 ${
              isAudioEnabled
                ? 'bg-primary text-white hover:bg-primary dark:bg-primary dark:hover:bg-primary'
                : 'bg-gray-200 text-gray-500 hover:bg-gray-500/20 dark:bg-gray-500 dark:text-gray-400 dark:hover:bg-gray-500/80'
            }`}
          >
            {isAudioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
