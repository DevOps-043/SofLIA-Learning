'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_CONFIRM_DIALOG,
  DEFAULT_EVENT_FORM,
  DEFAULT_TOAST,
} from './study-planner-calendar.constants';
import { loadStudyPlannerCalendarEvents } from './study-planner-calendar.service';
import type {
  CalendarEvent,
  StudyPlannerCalendarConfirmDialogState,
  StudyPlannerCalendarEventForm,
  StudyPlannerCalendarProps,
  StudyPlannerCalendarToastState,
} from './study-planner-calendar.types';
import { buildStudyPlannerCalendarLogicResult } from './study-planner-calendar-logic-result';
import { useStudyPlannerCalendarEventActions } from './useStudyPlannerCalendarEventActions';
import { useStudyPlannerCalendarNavigation } from './useStudyPlannerCalendarNavigation';

export function useStudyPlannerCalendarLogic({
  showOnlyPlanEvents = false,
  refreshTrigger = 0,
  selectedPlanId = null,
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

  const loadEvents = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoadingEvents(true);
    }

    try {
      const combinedEvents = await loadStudyPlannerCalendarEvents({
        currentDate: navigation.currentDate,
        selectedPlanId,
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
  }, [navigation.currentDate, navigation.view, selectedPlanId]);

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
        ? allEvents.filter(event => event.source === 'study_session')
        : allEvents,
    );
  }, [allEvents, showOnlyPlanEvents]);

  const {
    handleCreateEvent,
    handleDeleteEvent,
    handleEditEvent,
    handleSaveEvent,
  } = useStudyPlannerCalendarEventActions({
    currentDate: navigation.currentDate,
    eventForm,
    isCreatingEvent,
    isSaving,
    loadEvents: () => loadEvents(),
    selectedEvent,
    setConfirmDialog,
    setEventForm,
    setIsCreatingEvent,
    setIsDeletingEvent,
    setIsEditMode,
    setIsEventModalOpen,
    setIsSaving,
    setSelectedEvent,
    setToast,
  });

  return buildStudyPlannerCalendarLogicResult({
    confirmDialog,
    eventForm,
    events,
    handleCreateEvent,
    handleDeleteEvent,
    handleEditEvent,
    handleManualRefresh: () => loadEvents(true),
    handleSaveEvent,
    hoveredRefreshButton,
    isCreatingEvent,
    isDeletingEvent,
    isEditMode,
    isEventModalOpen,
    isLoadingEvents,
    isMounted,
    isRefreshing,
    isSaving,
    navigation,
    selectedEvent,
    setEventForm,
    setHoveredRefreshButton,
    setIsCreatingEvent,
    setIsEditMode,
    setIsEventModalOpen,
    setSelectedEvent,
    setToast,
    toast,
  });
}
