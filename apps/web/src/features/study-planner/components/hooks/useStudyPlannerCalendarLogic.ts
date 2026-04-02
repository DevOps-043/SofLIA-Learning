'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  DEFAULT_CONFIRM_DIALOG,
  DEFAULT_EVENT_FORM,
  DEFAULT_TOAST,
  STUDY_PLANNER_EVENT_COLORS,
} from './study-planner-calendar.constants';
import {
  deleteStudyPlannerCalendarEvent,
  loadStudyPlannerCalendarEvents,
  saveStudyPlannerCalendarEvent,
} from './study-planner-calendar.service';
import type {
  CalendarEvent,
  StudyPlannerCalendarConfirmDialogState,
  StudyPlannerCalendarEventForm,
  StudyPlannerCalendarProps,
  StudyPlannerCalendarToastState,
} from './study-planner-calendar.types';
import {
  buildDefaultEventFormForDate,
  buildEventFormFromEvent,
  getEventColor,
  getEventPosition,
  getEventsForDay,
} from './study-planner-calendar.utils';
import { useStudyPlannerCalendarNavigation } from './useStudyPlannerCalendarNavigation';

export function useStudyPlannerCalendarLogic({
  showOnlyPlanEvents = false,
  refreshTrigger = 0,
}: StudyPlannerCalendarProps) {
  const navigation = useStudyPlannerCalendarNavigation();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hoveredRefreshButton, setHoveredRefreshButton] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [eventForm, setEventForm] =
    useState<StudyPlannerCalendarEventForm>(DEFAULT_EVENT_FORM);
  const [toast, setToast] =
    useState<StudyPlannerCalendarToastState>(DEFAULT_TOAST);
  const [confirmDialog, setConfirmDialog] =
    useState<StudyPlannerCalendarConfirmDialogState>(DEFAULT_CONFIRM_DIALOG);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const loadEvents = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoadingEvents(true);
      }

      try {
        const combinedEvents = await loadStudyPlannerCalendarEvents({
          currentDate: navigation.currentDate,
          view: navigation.view,
        });
        setAllEvents(combinedEvents);
      } catch {
        setEvents([]);
        setAllEvents([]);
      } finally {
        setIsLoadingEvents(false);
        setIsRefreshing(false);
      }
    },
    [navigation.currentDate, navigation.view]
  );

  useEffect(() => {
    loadEvents();
  }, [loadEvents, refreshTrigger]);

  useEffect(() => {
    const intervalId = globalThis.setInterval(() => {
      loadEvents(false);
    }, 5 * 60 * 1000);

    return () => globalThis.clearInterval(intervalId);
  }, [loadEvents]);

  useEffect(() => {
    setEvents(
      showOnlyPlanEvents
        ? allEvents.filter((event) => event.source === 'study_session')
        : allEvents
    );
  }, [allEvents, showOnlyPlanEvents]);

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog((previousDialog) => ({
      ...previousDialog,
      isOpen: false,
    }));
  }, []);

  const handleEditEvent = useCallback(() => {
    if (!selectedEvent) {
      return;
    }

    setIsEditMode(true);
    setEventForm(buildEventFormFromEvent(selectedEvent));
  }, [selectedEvent]);

  const performDeleteEvent = useCallback(async () => {
    if (!selectedEvent) {
      return;
    }

    setIsDeletingEvent(true);
    try {
      const result = await deleteStudyPlannerCalendarEvent({
        event: selectedEvent,
      });

      if (result.success) {
        await loadEvents();
        setIsEventModalOpen(false);
        setSelectedEvent(null);
        setToast({
          isOpen: true,
          message: 'Evento eliminado exitosamente',
          type: 'success',
        });
        return;
      }

      setToast({
        isOpen: true,
        message: result.errorMessage || 'Error al eliminar el evento',
        type: 'error',
      });
    } catch {
      setToast({
        isOpen: true,
        message: 'Error al eliminar el evento',
        type: 'error',
      });
    } finally {
      setIsDeletingEvent(false);
    }
  }, [loadEvents, selectedEvent]);

  const handleDeleteEvent = useCallback(() => {
    if (!selectedEvent) {
      return;
    }

    setConfirmDialog({
      isOpen: true,
      message: '¿Estás seguro de que deseas eliminar este evento?',
      onConfirm: async () => {
        closeConfirmDialog();
        await performDeleteEvent();
      },
      onCancel: closeConfirmDialog,
    });
  }, [closeConfirmDialog, performDeleteEvent, selectedEvent]);

  const handleSaveEvent = useCallback(async () => {
    if (isSaving) {
      return;
    }

    if (!eventForm.title || !eventForm.start || !eventForm.end) {
      setToast({
        isOpen: true,
        message: 'Por favor completa todos los campos requeridos',
        type: 'error',
      });
      return;
    }

    try {
      setIsSaving(true);
      const result = await saveStudyPlannerCalendarEvent({
        eventForm,
        isCreatingEvent,
        selectedEvent,
      });

      if (result.success) {
        await loadEvents();
        setIsEditMode(false);
        setIsCreatingEvent(false);
        setIsEventModalOpen(false);
        setSelectedEvent(null);
        setEventForm(DEFAULT_EVENT_FORM);
        setToast({
          isOpen: true,
          message: isCreatingEvent
            ? 'Evento creado exitosamente'
            : 'Evento actualizado exitosamente',
          type: 'success',
        });
        return;
      }

      setToast({
        isOpen: true,
        message: result.errorMessage || 'Error al guardar el evento',
        type: 'error',
      });
    } catch {
      setToast({
        isOpen: true,
        message: 'Error al guardar el evento',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  }, [eventForm, isCreatingEvent, isSaving, loadEvents, selectedEvent]);

  const handleCreateEvent = useCallback(() => {
    setIsCreatingEvent(true);
    setIsEditMode(true);
    setSelectedEvent(null);
    setEventForm(buildDefaultEventFormForDate(navigation.currentDate));
    setIsEventModalOpen(true);
  }, [navigation.currentDate]);

  return {
    currentDate: navigation.currentDate,
    setCurrentDate: navigation.setCurrentDate,
    view: navigation.view,
    setView: navigation.setView,
    events,
    isLoadingEvents,
    isRefreshing,
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
    eventColors: STUDY_PLANNER_EVENT_COLORS,
    today: navigation.today,
    weekDayNames: navigation.weekDayNames,
    hours: navigation.hours,
    monthDays: navigation.monthDays,
    weekDays: navigation.weekDays,
    weekRange: navigation.weekRange,
    goToPreviousMonth: navigation.goToPreviousMonth,
    goToNextMonth: navigation.goToNextMonth,
    goToToday: navigation.goToToday,
    goToPreviousWeek: navigation.goToPreviousWeek,
    goToNextWeek: navigation.goToNextWeek,
    goToPreviousDay: navigation.goToPreviousDay,
    goToNextDay: navigation.goToNextDay,
    handleManualRefresh: () => loadEvents(true),
    handleEditEvent,
    handleDeleteEvent,
    handleSaveEvent,
    handleCreateEvent,
    getEventsForDay: (date: Parameters<typeof getEventsForDay>[1]) =>
      getEventsForDay(events, date),
    getEventColor,
    getEventPosition,
  };
}
