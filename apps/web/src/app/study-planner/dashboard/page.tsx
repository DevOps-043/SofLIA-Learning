'use client';

import Joyride from 'react-joyride';
import { StudyPlannerCalendar } from '../../../features/study-planner/components/StudyPlannerCalendar';
import {
  StudyPlannerDashboardAssistant,
  StudyPlannerDashboardCalendarConfigModal,
  StudyPlannerDashboardCalendarModal,
  StudyPlannerDashboardConfirmDialog,
} from '../../../features/study-planner/components/dashboard';
import { StudyPlannerDashboardToolbarV2 } from '../../../features/study-planner/components/dashboard/StudyPlannerDashboardToolbarV2';
import { useStudyPlannerDashboardLogicV2 } from '../../../features/study-planner/hooks/useStudyPlannerDashboardLogicV2';
import { redirectToDashboard } from '../../../features/auth/actions/dashboard-redirect';
import { ToastNotification } from '../../../core/components/ToastNotification';

export default function StudyPlannerDashboardPage() {
  const {
    availablePlans,
    messages,
    isSending,
    error,
    clearMessages,
    clearError,
    restartTour,
    joyrideProps,
    isMounted,
    isLiaPanelOpen,
    setIsLiaPanelOpen,
    isLiaCollapsed,
    setIsLiaCollapsed,
    liaPanelRef,
    messagesEndRef,
    message,
    setMessage,
    isCalendarModalOpen,
    setIsCalendarModalOpen,
    isGoogleConnected,
    connectedProvider,
    isConnecting,
    connectingProvider,
    hoveredButton,
    setHoveredButton,
    calendarError,
    selectedPlanId,
    isDeletingPlan,
    isRecreatingPlan,
    showOnlyPlanEvents,
    setShowOnlyPlanEvents,
    isCalendarConfigOpen,
    setIsCalendarConfigOpen,
    hasConfiguredCalendars,
    setHasConfiguredCalendars,
    calendarRefreshTrigger,
    setCalendarRefreshTrigger,
    toast,
    setToast,
    confirmDialog,
    handleConnect,
    handleDisconnect,
    handleDeletePlan,
    handlePlanSelection,
    handleRecreatePlan,
    handleSendMessage,
  } = useStudyPlannerDashboardLogicV2();

  return (
    <div className="min-h-screen flex overflow-hidden bg-white dark:bg-[#0F1419]">
      <div
        id="dashboard-calendar-container"
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isLiaPanelOpen && !isLiaCollapsed ? 'mr-[520px]' : ''
        }`}
      >
        <StudyPlannerDashboardToolbarV2
          availablePlans={availablePlans}
          connectedProvider={connectedProvider}
          hasConfiguredCalendars={hasConfiguredCalendars}
          hoveredButton={hoveredButton}
          isCalendarConnected={isGoogleConnected}
          isDeletingPlan={isDeletingPlan}
          isRecreatingPlan={isRecreatingPlan}
          onDeletePlan={handleDeletePlan}
          onGoBack={redirectToDashboard}
          onOpenCalendarConfig={() => setIsCalendarConfigOpen(true)}
          onOpenCalendarModal={() => setIsCalendarModalOpen(true)}
          onRecreatePlan={handleRecreatePlan}
          onRestartTour={restartTour}
          onSelectPlan={handlePlanSelection}
          selectedPlanId={selectedPlanId}
          setHoveredButton={setHoveredButton}
        />

        <div className="flex-1 overflow-auto px-0 sm:px-6 pb-6">
          <div className="bg-white dark:bg-[#1E2329] rounded-none sm:rounded-xl shadow-sm border-x-0 sm:border border-[#E9ECEF] dark:border-[#6C757D]/30 p-0 sm:p-6 h-full flex flex-col">
            <StudyPlannerCalendar
              refreshTrigger={calendarRefreshTrigger}
              selectedPlanId={selectedPlanId}
              showOnlyPlanEvents={showOnlyPlanEvents}
            />
          </div>
        </div>
      </div>

      <StudyPlannerDashboardAssistant
        clearError={clearError}
        clearMessages={clearMessages}
        error={error}
        isCollapsed={isLiaCollapsed}
        isOpen={isLiaPanelOpen}
        isSending={isSending}
        liaPanelRef={liaPanelRef}
        message={message}
        messages={messages}
        messagesEndRef={messagesEndRef}
        onMessageChange={setMessage}
        onOpen={() => {
          setIsLiaPanelOpen(true);
          setIsLiaCollapsed(false);
        }}
        onSendMessage={handleSendMessage}
        setIsCollapsed={setIsLiaCollapsed}
      />

      <StudyPlannerDashboardCalendarModal
        calendarError={calendarError}
        connectedProvider={connectedProvider}
        connectingProvider={connectingProvider}
        isConnecting={isConnecting}
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />

      <StudyPlannerDashboardCalendarConfigModal
        isOpen={isCalendarConfigOpen}
        onCalendarSelectionSaved={() => {
          setHasConfiguredCalendars(true);
          setCalendarRefreshTrigger((previous) => previous + 1);
        }}
        onClose={() => setIsCalendarConfigOpen(false)}
        provider={connectedProvider}
        showOnlyPlanEvents={showOnlyPlanEvents}
        toggleShowOnlyPlanEvents={() => setShowOnlyPlanEvents(!showOnlyPlanEvents)}
      />

      <ToastNotification
        duration={toast.type === 'error' ? 6000 : 4000}
        isOpen={toast.isOpen}
        message={toast.message}
        onClose={() => setToast({ ...toast, isOpen: false })}
        type={toast.type}
      />

      <StudyPlannerDashboardConfirmDialog
        isDeletingPlan={isDeletingPlan}
        isOpen={confirmDialog.isOpen}
        isRecreatingPlan={isRecreatingPlan}
        message={confirmDialog.message}
        onCancel={confirmDialog.onCancel}
        onConfirm={confirmDialog.onConfirm}
      />

      {isMounted && <Joyride {...joyrideProps} />}
    </div>
  );
}
