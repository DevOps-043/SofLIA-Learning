import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { DEFAULT_EVENT_FORM } from './study-planner-calendar.constants';
import {
  deleteStudyPlannerCalendarEvent,
  saveStudyPlannerCalendarEvent,
} from './study-planner-calendar.service';
import type {
  CalendarEvent,
  StudyPlannerCalendarConfirmDialogState,
  StudyPlannerCalendarEventForm,
  StudyPlannerCalendarToastState,
} from './study-planner-calendar.types';
import {
  buildDefaultEventFormForDate,
  buildEventFormFromEvent,
} from './study-planner-calendar.utils';

interface UseStudyPlannerCalendarEventActionsParams {
  currentDate: Date;
  eventForm: StudyPlannerCalendarEventForm;
  isCreatingEvent: boolean;
  isSaving: boolean;
  loadEvents: () => Promise<void>;
  selectedEvent: CalendarEvent | null;
  setConfirmDialog: Dispatch<SetStateAction<StudyPlannerCalendarConfirmDialogState>>;
  setEventForm: Dispatch<SetStateAction<StudyPlannerCalendarEventForm>>;
  setIsCreatingEvent: Dispatch<SetStateAction<boolean>>;
  setIsDeletingEvent: Dispatch<SetStateAction<boolean>>;
  setIsEditMode: Dispatch<SetStateAction<boolean>>;
  setIsEventModalOpen: Dispatch<SetStateAction<boolean>>;
  setIsSaving: Dispatch<SetStateAction<boolean>>;
  setSelectedEvent: Dispatch<SetStateAction<CalendarEvent | null>>;
  setToast: Dispatch<SetStateAction<StudyPlannerCalendarToastState>>;
}

export function useStudyPlannerCalendarEventActions({
  currentDate,
  eventForm,
  isCreatingEvent,
  isSaving,
  loadEvents,
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
}: UseStudyPlannerCalendarEventActionsParams) {
  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog(previousDialog => ({
      ...previousDialog,
      isOpen: false,
    }));
  }, [setConfirmDialog]);

  const handleEditEvent = useCallback(() => {
    if (!selectedEvent) return;

    setIsEditMode(true);
    setEventForm(buildEventFormFromEvent(selectedEvent));
  }, [selectedEvent, setEventForm, setIsEditMode]);

  const performDeleteEvent = useCallback(async () => {
    if (!selectedEvent) return;

    setIsDeletingEvent(true);
    try {
      const result = await deleteStudyPlannerCalendarEvent({ event: selectedEvent });

      if (result.success) {
        await loadEvents();
        setIsEventModalOpen(false);
        setSelectedEvent(null);
        setToast({ isOpen: true, message: 'Evento eliminado exitosamente', type: 'success' });
        return;
      }

      setToast({
        isOpen: true,
        message: result.errorMessage || 'Error al eliminar el evento',
        type: 'error',
      });
    } catch {
      setToast({ isOpen: true, message: 'Error al eliminar el evento', type: 'error' });
    } finally {
      setIsDeletingEvent(false);
    }
  }, [
    loadEvents,
    selectedEvent,
    setIsDeletingEvent,
    setIsEventModalOpen,
    setSelectedEvent,
    setToast,
  ]);

  const handleDeleteEvent = useCallback(() => {
    if (!selectedEvent) return;

    setConfirmDialog({
      isOpen: true,
      message: 'Estas seguro de que deseas eliminar este evento?',
      onConfirm: async () => {
        closeConfirmDialog();
        await performDeleteEvent();
      },
      onCancel: closeConfirmDialog,
    });
  }, [closeConfirmDialog, performDeleteEvent, selectedEvent, setConfirmDialog]);

  const handleSaveEvent = useCallback(async () => {
    if (isSaving) return;

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
      setToast({ isOpen: true, message: 'Error al guardar el evento', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  }, [
    eventForm,
    isCreatingEvent,
    isSaving,
    loadEvents,
    selectedEvent,
    setEventForm,
    setIsCreatingEvent,
    setIsEditMode,
    setIsEventModalOpen,
    setIsSaving,
    setSelectedEvent,
    setToast,
  ]);

  const handleCreateEvent = useCallback(() => {
    setIsCreatingEvent(true);
    setIsEditMode(true);
    setSelectedEvent(null);
    setEventForm(buildDefaultEventFormForDate(currentDate));
    setIsEventModalOpen(true);
  }, [
    currentDate,
    setEventForm,
    setIsCreatingEvent,
    setIsEditMode,
    setIsEventModalOpen,
    setSelectedEvent,
  ]);

  return {
    handleCreateEvent,
    handleDeleteEvent,
    handleEditEvent,
    handleSaveEvent,
  };
}
