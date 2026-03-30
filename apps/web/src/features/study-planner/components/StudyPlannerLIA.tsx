'use client';

import { StudyPlannerConversationShell } from './StudyPlannerConversationShell';
import { StudyPlannerIntroOverlay } from './StudyPlannerIntroOverlay';
import { useStudyPlannerLIALogic } from './hooks/useStudyPlannerLIALogic';

export function StudyPlannerSofLIA() {
  const {
    // State
    isVisible,
    currentStep,
    isAudioEnabled,
    isMobile,
    showConversation,
    userMessage,
    showCourseSelector,
    hoveredButton,
    availableCourses,
    selectedCourseIds,
    isLoadingCourses,
    courseSearchQuery,
    showCalendarModal,
    isConnectingCalendar,
    connectedCalendar,
    showCalendarConfig,
    hasConfiguredCalendars,
    studyApproach,
    showApproachModal,
    showApproachButtons,
    showDateModal,
    selectedDate,
    currentMonth,
    isProcessing,
    conversationHistory,
    userContext,
    // Setters used in JSX
    setHoveredButton,
    setShowCalendarModal,
    setShowCalendarConfig,
    setCourseSearchQuery,
    setSelectedDate,
    setUserMessage,
    // Voice
    isListening,
    isSpeaking,
    toggleListening,
    toggleAudio,
    // Handlers
    restartTour,
    handleNext,
    handlePrevious,
    handleComplete,
    handleSkip,
    handleApproachSelection,
    handleCalendarConnect,
    handleCalendarConfigSaveSuccess,
    handleCalendarModalCloseButtonClick,
    handleCalendarModalOverlayClose,
    handleDateMonthChange,
    handleDateSelection,
    handleSendMessage,
    handlePlannerBack,
    confirmCourseSelection,
    toggleCourseSelection,
    skipCalendarConnection,
    // Session storage
    handleDiscardSession,
    handleResumeSession,
    savedSessionDate,
    showResumePrompt,
  } = useStudyPlannerLIALogic();

  return (
    <>
      <StudyPlannerIntroOverlay
        isVisible={isVisible}
        showResumePrompt={showResumePrompt}
        savedSessionDate={savedSessionDate}
        currentStep={currentStep}
        isMobile={isMobile}
        isSpeaking={isSpeaking}
        isAudioEnabled={isAudioEnabled}
        isListening={isListening}
        isProcessing={isProcessing}
        onToggleAudio={toggleAudio}
        onSkip={handleSkip}
        onDiscardSession={handleDiscardSession}
        onResumeSession={handleResumeSession}
        onToggleListening={toggleListening}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onComplete={handleComplete}
      />

      <StudyPlannerConversationShell
        isVisible={showConversation}
        isMobile={isMobile}
        connectedCalendar={connectedCalendar}
        isProcessing={isProcessing}
        showCalendarModal={showCalendarModal}
        hoveredButton={hoveredButton}
        hasConfiguredCalendars={hasConfiguredCalendars}
        isAudioEnabled={isAudioEnabled}
        userType={userContext?.userType ?? null}
        conversationHistory={conversationHistory}
        showApproachButtons={showApproachButtons}
        studyApproach={studyApproach}
        showCourseSelector={showCourseSelector}
        availableCourses={availableCourses}
        selectedCourseIds={selectedCourseIds}
        isLoadingCourses={isLoadingCourses}
        courseSearchQuery={courseSearchQuery}
        showCalendarConfig={showCalendarConfig}
        showApproachModal={showApproachModal}
        showDateModal={showDateModal}
        currentMonth={currentMonth}
        selectedDate={selectedDate}
        userMessage={userMessage}
        isConnectingCalendar={isConnectingCalendar}
        isListening={isListening}
        onBack={handlePlannerBack}
        onHoverChange={setHoveredButton}
        onOpenCalendar={() => setShowCalendarModal(true)}
        onOpenCalendarConfig={() => setShowCalendarConfig(true)}
        onRestartTour={restartTour}
        onAskHowItWorks={() => {
          void handleSendMessage('¿Cómo funciona?');
        }}
        onToggleAudio={toggleAudio}
        onApproachSelect={(approach) => {
          void handleApproachSelection(approach);
        }}
        onSearchChange={setCourseSearchQuery}
        onClearSearch={() => setCourseSearchQuery('')}
        onToggleCourse={toggleCourseSelection}
        onConfirmCourseSelection={confirmCourseSelection}
        onConnectCalendar={handleCalendarConnect}
        onSkipCalendar={() => {
          void skipCalendarConnection();
        }}
        onCalendarOverlayClick={handleCalendarModalOverlayClose}
        onCalendarCloseButtonClick={handleCalendarModalCloseButtonClick}
        onCloseCalendarConfig={() => setShowCalendarConfig(false)}
        onCalendarConfigSaveSuccess={handleCalendarConfigSaveSuccess}
        onMonthChange={handleDateMonthChange}
        onSelectDate={setSelectedDate}
        onSkipDate={() => {
          void handleDateSelection(null, true);
        }}
        onConfirmDate={() => {
          if (selectedDate) {
            void handleDateSelection(selectedDate);
          }
        }}
        onUserMessageChange={setUserMessage}
        onSubmitMessage={(message) => {
          void handleSendMessage(message);
        }}
        onToggleListening={toggleListening}
      />
    </>
  );
}
