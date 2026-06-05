'use client';

import { StudyPlannerApproachButtons } from './StudyPlannerApproachButtons';
import { StudyPlannerCalendarConfigModal } from './StudyPlannerCalendarConfigModal';
import { StudyPlannerCalendarModal } from './StudyPlannerCalendarModal';
import { StudyPlannerConversationComposer } from './StudyPlannerConversationComposer';
import { StudyPlannerConversationMessages } from './StudyPlannerConversationMessages';
import { StudyPlannerConversationHeader } from './StudyPlannerConversationHeader';
import { StudyPlannerCourseSelectorModal } from './StudyPlannerCourseSelectorModal';
import { StudyPlannerTargetDateModal } from './StudyPlannerTargetDateModal';
import { SchedulePreviewPanel } from './schedule-preview';
import type { StudyPlannerConversationShellProps } from './StudyPlannerConversationShell.types';

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
  onAskHowItWorks,
  onToggleAudio,
  onApproachSelect,
  onSearchChange,
  onClearSearch,
  onToggleCourse,
  onConfirmCourseSelection,
  onCloseCourseSelector,
  onOpenCourseSelector,
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
  if (!isVisible) {
    return null;
  }

  return (
    <div className="flex h-app-dynamic w-full overflow-hidden bg-white dark:bg-carbon-900">
      <div 
        className={`flex h-app-dynamic flex-col overflow-hidden bg-white dark:bg-carbon-900 transition-all duration-500 ease-in-out ${
          showSchedulePreview ? 'w-full sm:w-1/2 border-r border-gray-200 dark:border-gray-500/30' : 'w-full'
        }`} 
        suppressHydrationWarning
      >
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
        onAskHowItWorks={onAskHowItWorks}
        onToggleAudio={onToggleAudio}
      />

      <div className="min-h-0 flex-1 overflow-y-auto bg-gray-50 px-3 py-4 dark:bg-carbon-900/50 sm:px-4 sm:py-6">
        <div className="mx-auto max-w-4xl space-y-4 pb-4 sm:space-y-6">
          <StudyPlannerConversationMessages
            conversationHistory={conversationHistory}
            isListening={isListening}
            isProcessing={isProcessing}
            onOpenCourseSelector={onOpenCourseSelector}
            selectedCourseIds={selectedCourseIds}
            showCourseSelector={showCourseSelector}
          />

          <StudyPlannerApproachButtons
            isVisible={showApproachButtons}
            selectedApproach={studyApproach}
            onSelect={onApproachSelect}
          />
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
        onClose={onCloseCourseSelector}
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

      <StudyPlannerConversationComposer
        isListening={isListening}
        isMobile={isMobile}
        isProcessing={isProcessing}
        onSubmitMessage={onSubmitMessage}
        onToggleListening={onToggleListening}
        onUserMessageChange={onUserMessageChange}
        showApproachButtons={showApproachButtons}
        studyApproach={studyApproach}
        userMessage={userMessage}
      />
      </div>
      {/* The SchedulePreviewPanel will slide in on the right side over the remaining 50% on desktop, or overlay on mobile */}
    </div>
  );
}
