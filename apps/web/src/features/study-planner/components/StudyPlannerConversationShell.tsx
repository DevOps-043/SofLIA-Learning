'use client';

import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Mic, MicOff, Send } from 'lucide-react';

import { StudyPlannerApproachButtons } from './StudyPlannerApproachButtons';
import { StudyPlannerApproachModal } from './StudyPlannerApproachModal';
import { StudyPlannerCalendarConfigModal } from './StudyPlannerCalendarConfigModal';
import { StudyPlannerCalendarModal } from './StudyPlannerCalendarModal';
import { StudyPlannerConversationHeader } from './StudyPlannerConversationHeader';
import { StudyPlannerCourseSelectorModal } from './StudyPlannerCourseSelectorModal';
import { StudyPlannerTargetDateModal } from './StudyPlannerTargetDateModal';
import { SchedulePreviewPanel } from './schedule-preview';
import type {
  StudyApproach,
  StudyPlannerCalendarProvider,
  StudyPlannerCourseOption,
  StudyPlannerMessage,
} from '../types/planner-ui.types';
import type { StudyPlannerStoredLessonDistribution } from '../types/planner-schedule.types';
import type { UserType } from '../types/user-context.types';

interface StudyPlannerConversationShellProps {
  isVisible: boolean;
  isMobile: boolean;
  connectedCalendar: StudyPlannerCalendarProvider;
  isProcessing: boolean;
  showCalendarModal: boolean;
  hoveredButton: string | null;
  hasConfiguredCalendars: boolean;
  isAudioEnabled: boolean;
  userType: UserType | null;
  conversationHistory: StudyPlannerMessage[];
  showApproachButtons: boolean;
  studyApproach: StudyApproach | null;
  showCourseSelector: boolean;
  availableCourses: StudyPlannerCourseOption[];
  selectedCourseIds: string[];
  isLoadingCourses: boolean;
  courseSearchQuery: string;
  showCalendarConfig: boolean;
  showApproachModal: boolean;
  showDateModal: boolean;
  currentMonth: Date | null;
  selectedDate: Date | null;
  userMessage: string;
  isConnectingCalendar: boolean;
  isListening: boolean;
  onBack: () => void;
  onHoverChange: (value: string | null) => void;
  onOpenCalendar: () => void;
  onOpenCalendarConfig: () => void;
  onRestartTour: () => void;
  onAskHowItWorks: () => void;
  onToggleAudio: () => void;
  onApproachSelect: (approach: StudyApproach) => void;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  onToggleCourse: (courseId: string) => void;
  onConfirmCourseSelection: () => void;
  onConnectCalendar: (provider: 'google' | 'microsoft') => void;
  onSkipCalendar: () => void;
  onCalendarOverlayClick: () => void;
  onCalendarCloseButtonClick: () => void;
  onCloseCalendarConfig: () => void;
  onCalendarConfigSaveSuccess: () => void;
  onMonthChange: (date: Date) => void;
  onSelectDate: (date: Date) => void;
  onSkipDate: () => void;
  onConfirmDate: () => void;
  onUserMessageChange: (value: string) => void;
  onSubmitMessage: (message: string) => void;
  onToggleListening: () => void;
  // Schedule Preview
  savedLessonDistribution: StudyPlannerStoredLessonDistribution[];
  showSchedulePreview: boolean;
  showSchedulePreviewTab: boolean;
  onSchedulePreviewClose: () => void;
  onSchedulePreviewOpen: () => void;
}

export function StudyPlannerConversationShell({
  isVisible,
  isMobile,
  connectedCalendar,
  isProcessing,
  showCalendarModal,
  hoveredButton,
  hasConfiguredCalendars,
  isAudioEnabled,
  userType,
  conversationHistory,
  showApproachButtons,
  studyApproach,
  showCourseSelector,
  availableCourses,
  selectedCourseIds,
  isLoadingCourses,
  courseSearchQuery,
  showCalendarConfig,
  showApproachModal,
  showDateModal,
  currentMonth,
  selectedDate,
  userMessage,
  isConnectingCalendar,
  isListening,
  onBack,
  onHoverChange,
  onOpenCalendar,
  onOpenCalendarConfig,
  onRestartTour,
  onAskHowItWorks,
  onToggleAudio,
  onApproachSelect,
  onSearchChange,
  onClearSearch,
  onToggleCourse,
  onConfirmCourseSelection,
  onConnectCalendar,
  onSkipCalendar,
  onCalendarOverlayClick,
  onCalendarCloseButtonClick,
  onCloseCalendarConfig,
  onCalendarConfigSaveSuccess,
  onMonthChange,
  onSelectDate,
  onSkipDate,
  onConfirmDate,
  onUserMessageChange,
  onSubmitMessage,
  onToggleListening,
  savedLessonDistribution,
  showSchedulePreview,
  showSchedulePreviewTab,
  onSchedulePreviewClose,
  onSchedulePreviewOpen,
}: StudyPlannerConversationShellProps) {
  const hasComposerText = userMessage.trim().length > 0;
  const isComposerDisabled = isProcessing || (showApproachButtons && !studyApproach);
  const isVoiceButtonDisabled = isProcessing || (isListening && hasComposerText) || (showApproachButtons && !studyApproach);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-white supports-[height:100dvh]:h-[100dvh] dark:bg-[#0F1419]" suppressHydrationWarning>
      <StudyPlannerConversationHeader
        isMobile={isMobile}
        connectedCalendar={connectedCalendar}
        isProcessing={isProcessing}
        showCalendarModal={showCalendarModal}
        hoveredButton={hoveredButton}
        hasConfiguredCalendars={hasConfiguredCalendars}
        isAudioEnabled={isAudioEnabled}
        onBack={onBack}
        onHoverChange={onHoverChange}
        onOpenCalendar={onOpenCalendar}
        onOpenCalendarConfig={onOpenCalendarConfig}
        onRestartTour={onRestartTour}
        onAskHowItWorks={onAskHowItWorks}
        onToggleAudio={onToggleAudio}
      />

      <div className="min-h-0 flex-1 overflow-y-auto bg-[#F8F9FA] px-3 py-4 dark:bg-[#0F1419]/50 sm:px-4 sm:py-6">
        <div className="mx-auto max-w-4xl space-y-4 pb-4 sm:space-y-6">
          {conversationHistory.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: index * 0.05 }}
              className={`group flex max-w-full ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex max-w-[85%] items-end gap-2 sm:max-w-[80%] sm:gap-2.5 ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                {message.role === 'assistant' && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: index * 0.05 + 0.1, type: 'spring', stiffness: 200, damping: 15 }}
                    className="relative hidden h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border-2 border-[#0A2540]/30 shadow-lg shadow-[#0A2540]/20 dark:border-[#00D4B3]/40 dark:shadow-[#00D4B3]/20 sm:block sm:h-10 sm:w-10"
                  >
                    <Image src="/lia-avatar.png" alt="LIA" fill sizes="40px" className="object-cover" />
                  </motion.div>
                )}

                {message.role === 'assistant' && (
                  <div className="relative mt-1 h-6 w-6 flex-shrink-0 self-start overflow-hidden rounded-full border border-[#0A2540]/30 dark:border-[#00D4B3]/40 sm:hidden">
                    <Image src="/lia-avatar.png" alt="LIA" fill sizes="24px" className="object-cover" />
                  </div>
                )}

                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05 + 0.15, type: 'spring', stiffness: 300, damping: 20 }}
                  className={`relative max-w-full overflow-hidden px-3.5 py-2.5 shadow-sm sm:px-5 sm:py-3 ${
                    message.role === 'user'
                      ? 'rounded-[18px] rounded-br-[6px] bg-[#0A2540] text-white shadow-[#0A2540]/25 sm:rounded-[22px]'
                      : 'rounded-[18px] rounded-bl-[6px] border border-[#E9ECEF] bg-[#FFFFFF] text-[#0A2540] shadow-sm dark:border-[#6C757D]/30 dark:bg-[#1E2329] dark:text-white sm:rounded-[22px]'
                  }`}
                >
                  <div className="relative z-10 break-words">
                    {message.role === 'assistant' ? (
                      <div className="font-body text-[14px] leading-[1.6] tracking-wide text-[#0A2540] dark:text-white sm:text-[16px] sm:leading-[1.75]">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                            ul: ({ children }) => <ul className="my-2 list-disc pl-5">{children}</ul>,
                            li: ({ children }) => <li className="mb-1">{children}</li>,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="font-body whitespace-pre-wrap text-[14px] font-medium leading-[1.6] tracking-wide text-white sm:text-[16px] sm:leading-[1.75]">
                        {message.content}
                      </p>
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ))}

          <StudyPlannerApproachButtons
            isVisible={showApproachButtons}
            selectedApproach={studyApproach}
            onSelect={onApproachSelect}
          />

          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="group flex justify-start"
            >
              <div className="flex items-end gap-2 sm:gap-2.5">
                <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border-2 border-[#0A2540]/30 shadow-lg dark:border-[#00D4B3]/40 sm:h-10 sm:w-10">
                  <Image src="/lia-avatar.png" alt="LIA" fill sizes="40px" className="object-cover" />
                </div>
                <motion.div
                  className="relative overflow-hidden rounded-[20px] rounded-bl-[6px] border border-[#E9ECEF] bg-[#FFFFFF] px-4 py-3 shadow-sm dark:border-[#6C757D]/30 dark:bg-[#1E2329] sm:px-5 sm:py-3.5"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                >
                  <div className="relative z-10 flex items-center gap-1.5">
                    {[0, 0.2, 0.4].map((delay) => (
                      <motion.div
                        key={delay}
                        animate={{ scale: [1, 1.3, 1], y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay, ease: 'easeInOut' }}
                        className="h-2 w-2 rounded-full bg-[#00D4B3] shadow-lg sm:h-2.5 sm:w-2.5"
                      />
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          <div className="h-2 sm:h-4" />

          {isListening && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center">
              <div className="flex items-center gap-2 rounded-full border border-[#10B981]/30 bg-[#10B981]/10 px-4 py-2 dark:bg-[#10B981]/20">
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="h-3 w-3 rounded-full bg-[#10B981]"
                />
                <span className="text-sm text-[#10B981]">Escuchando...</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <StudyPlannerCourseSelectorModal
        isOpen={showCourseSelector}
        courses={availableCourses}
        selectedCourseIds={selectedCourseIds}
        isLoading={isLoadingCourses}
        searchQuery={courseSearchQuery}
        onSearchChange={onSearchChange}
        onClearSearch={onClearSearch}
        onToggleCourse={onToggleCourse}
        onConfirm={onConfirmCourseSelection}
      />

      <StudyPlannerCalendarModal
        isOpen={showCalendarModal}
        userType={userType}
        connectedCalendar={connectedCalendar}
        isConnectingCalendar={isConnectingCalendar}
        onConnect={onConnectCalendar}
        onSkip={onSkipCalendar}
        onOverlayClick={onCalendarOverlayClick}
        onCloseButtonClick={onCalendarCloseButtonClick}
      />

      <StudyPlannerCalendarConfigModal
        isOpen={showCalendarConfig}
        provider={connectedCalendar}
        onClose={onCloseCalendarConfig}
        onSaveSuccess={onCalendarConfigSaveSuccess}
      />

      <StudyPlannerApproachModal
        isOpen={showApproachModal}
        selectedApproach={studyApproach}
        onSelect={onApproachSelect}
      />

      <StudyPlannerTargetDateModal
        isOpen={showDateModal}
        currentMonth={currentMonth}
        selectedDate={selectedDate}
        onMonthChange={onMonthChange}
        onSelectDate={onSelectDate}
        onSkip={onSkipDate}
        onConfirm={onConfirmDate}
      />

      <SchedulePreviewPanel
        isOpen={showSchedulePreview}
        savedLessonDistribution={savedLessonDistribution}
        connectedCalendar={connectedCalendar}
        onClose={onSchedulePreviewClose}
        onOpen={onSchedulePreviewOpen}
        showReopenTab={showSchedulePreviewTab && !showSchedulePreview}
      />

      <div className="flex-shrink-0 border-t border-[#E9ECEF] bg-white px-3 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] backdrop-blur-xl dark:border-[#6C757D]/30 dark:bg-[#0F1419] sm:px-4 sm:py-4">
        <div className="mx-auto w-full max-w-4xl">
          <div className="flex w-full items-center gap-2 sm:gap-3">
            <input
              id="lia-chat-input"
              type="text"
              value={userMessage}
              onChange={(event) => onUserMessageChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey && hasComposerText) {
                  event.preventDefault();
                  onSubmitMessage(userMessage);
                  onUserMessageChange('');
                }
              }}
              placeholder={isMobile ? 'Escribe un mensaje...' : 'Escribe tu mensaje o usa el microfono...'}
              disabled={isComposerDisabled || isListening}
              style={{ fontSize: '16px' }}
              className="min-w-0 flex-1 rounded-xl border border-[#E9ECEF] bg-white px-4 py-3 text-[#0A2540] shadow-sm transition-all placeholder-[#6C757D] focus:border-[#00D4B3]/50 focus:outline-none focus:ring-2 focus:ring-[#00D4B3]/50 disabled:opacity-50 dark:border-[#6C757D]/30 dark:bg-[#1E2329] dark:text-white"
            />

            <motion.button
              id="lia-voice-button"
              onClick={() => {
                if (hasComposerText) {
                  onSubmitMessage(userMessage);
                  onUserMessageChange('');
                  return;
                }

                onToggleListening();
              }}
              disabled={isVoiceButtonDisabled}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl shadow-sm transition-all duration-300 sm:h-12 sm:w-12 ${
                hasComposerText
                  ? 'bg-[#0A2540] text-white hover:bg-[#0d2f4d] dark:bg-[#0A2540] dark:hover:bg-[#0d2f4d]'
                  : isListening
                    ? 'bg-[#10B981] text-white hover:bg-[#10B981]/90'
                    : 'bg-[#0A2540] text-white hover:bg-[#0d2f4d] dark:bg-[#0A2540] dark:hover:bg-[#0d2f4d]'
              } ${isVoiceButtonDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            >
              <AnimatePresence mode="wait">
                {isProcessing && hasComposerText ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Loader2 size={20} className="animate-spin" />
                  </motion.div>
                ) : hasComposerText ? (
                  <motion.div
                    key="send"
                    initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.8, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Send size={20} />
                  </motion.div>
                ) : isListening ? (
                  <motion.div
                    key="mic-off"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <MicOff size={20} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="mic"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Mic size={20} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
