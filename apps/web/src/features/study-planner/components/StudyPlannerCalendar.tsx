'use client';

import { ToastNotification } from '@/core/components/ToastNotification/ToastNotification';
import { useStudyPlannerCalendarLogic } from './hooks/useStudyPlannerCalendarLogic';
import {
  CalendarHeader,
  CalendarMonthView,
  CalendarWeekView,
  CalendarDayView,
  CalendarEventModal,
  CalendarDeleteConfirmDialog,
} from './calendar';

interface StudyPlannerCalendarProps {
  showOnlyPlanEvents?: boolean;
  refreshTrigger?: number;
}

export function StudyPlannerCalendar({
  showOnlyPlanEvents = false,
  refreshTrigger = 0,
}: StudyPlannerCalendarProps) {
  const {
    currentDate,
    setCurrentDate,
    view,
    setView,
    isRefreshing,
    isLoadingEvents,
    hoveredRefreshButton,
    setHoveredRefreshButton,
    selectedEvent,
    setSelectedEvent,
    isEventModalOpen,
    setIsEventModalOpen,
    isEditMode,
    setIsEditMode,
    isCreatingEvent,
    setIsCreatingEvent,
    isDeletingEvent,
    isSaving,
    isMounted,
    eventForm,
    setEventForm,
    toast,
    setToast,
    confirmDialog,
    eventColors,
    today,
    weekDayNames,
    hours,
    monthDays,
    weekDays,
    weekRange,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    goToPreviousWeek,
    goToNextWeek,
    goToPreviousDay,
    goToNextDay,
    handleManualRefresh,
    handleEditEvent,
    handleDeleteEvent,
    handleSaveEvent,
    handleCreateEvent,
    getEventsForDay,
    getEventColor,
    getEventPosition,
    getEventLayoutsForDay,
  } = useStudyPlannerCalendarLogic({ showOnlyPlanEvents, refreshTrigger });

  if (!isMounted) {
    return null;
  }

  return (
    <div className="h-full w-full flex flex-col max-w-[100vw] overflow-x-hidden">
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        setView={setView}
        weekRange={weekRange}
        isRefreshing={isRefreshing}
        isLoadingEvents={isLoadingEvents}
        hoveredRefreshButton={hoveredRefreshButton}
        setHoveredRefreshButton={setHoveredRefreshButton}
        goToPreviousMonth={goToPreviousMonth}
        goToNextMonth={goToNextMonth}
        goToPreviousWeek={goToPreviousWeek}
        goToNextWeek={goToNextWeek}
        goToPreviousDay={goToPreviousDay}
        goToNextDay={goToNextDay}
        goToToday={goToToday}
        handleManualRefresh={handleManualRefresh}
        handleCreateEvent={handleCreateEvent}
      />

      {view === 'month' && (
        <CalendarMonthView
          monthDays={monthDays}
          weekDayNames={weekDayNames}
          today={today}
          getEventsForDay={getEventsForDay}
          getEventColor={getEventColor}
          setCurrentDate={setCurrentDate}
          handleCreateEvent={handleCreateEvent}
          setSelectedEvent={setSelectedEvent}
          setIsEventModalOpen={setIsEventModalOpen}
        />
      )}

      {view === 'week' && (
        <CalendarWeekView
          weekDays={weekDays}
          today={today}
          hours={hours}
          getEventLayoutsForDay={getEventLayoutsForDay}
          setSelectedEvent={setSelectedEvent}
          setIsEventModalOpen={setIsEventModalOpen}
        />
      )}

      {view === 'day' && (
        <CalendarDayView
          currentDate={currentDate}
          today={today}
          hours={hours}
          getEventLayoutsForDay={getEventLayoutsForDay}
          setSelectedEvent={setSelectedEvent}
          setIsEventModalOpen={setIsEventModalOpen}
        />
      )}

      <CalendarEventModal
        isEventModalOpen={isEventModalOpen}
        selectedEvent={selectedEvent}
        isCreatingEvent={isCreatingEvent}
        isEditMode={isEditMode}
        setIsEditMode={setIsEditMode}
        setIsCreatingEvent={setIsCreatingEvent}
        isDeletingEvent={isDeletingEvent}
        isSaving={isSaving}
        eventForm={eventForm}
        setEventForm={setEventForm}
        eventColors={eventColors}
        handleEditEvent={handleEditEvent}
        handleDeleteEvent={handleDeleteEvent}
        handleSaveEvent={handleSaveEvent}
        setSelectedEvent={setSelectedEvent}
        setIsEventModalOpen={setIsEventModalOpen}
      />

      <ToastNotification
        isOpen={toast.isOpen}
        onClose={() => setToast({ ...toast, isOpen: false })}
        message={toast.message}
        type={toast.type}
        duration={toast.type === 'error' ? 6000 : 4000}
      />

      <CalendarDeleteConfirmDialog
        confirmDialog={confirmDialog}
        isDeletingEvent={isDeletingEvent}
      />
    </div>
  );
}
