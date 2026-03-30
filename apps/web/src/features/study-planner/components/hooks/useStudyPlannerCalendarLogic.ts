'use client';

import { useState, useEffect, useCallback } from 'react';
import moment from 'moment';

type ViewType = 'month' | 'week' | 'day';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  isAllDay?: boolean;
  provider?: 'google' | 'microsoft' | 'study' | 'local';
  source?: 'calendar' | 'study_session';
  googleEventId?: string;
  localEventId?: string;
  externalEventId?: string;
  color?: string;
}

interface StudyPlannerCalendarProps {
  showOnlyPlanEvents?: boolean;
  refreshTrigger?: number;
}

export function useStudyPlannerCalendarLogic({
  showOnlyPlanEvents = false,
  refreshTrigger = 0,
}: StudyPlannerCalendarProps) {
  const [currentDate, setCurrentDate] = useState(moment());
  const [view, setView] = useState<ViewType>('month');
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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    start: '',
    end: '',
    location: '',
    isAllDay: false,
    color: '#0A2540',
  });

  // Estado para notificaciones toast
  const [toast, setToast] = useState<{
    isOpen: boolean;
    message: string;
    type: 'error' | 'success' | 'info';
  }>({
    isOpen: false,
    message: '',
    type: 'error',
  });

  // Estado para modal de confirmación
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  }>({
    isOpen: false,
    message: '',
    onConfirm: () => { },
    onCancel: () => { },
  });

  // Colores predefinidos para eventos (usando paleta SOFLIA)
  const eventColors = [
    { name: 'Azul Profundo', value: '#0A2540' },
    { name: 'Aqua', value: '#00D4B3' },
    { name: 'Verde Suave', value: '#10B981' },
    { name: 'Ámbar', value: '#F59E0B' },
    { name: 'Azul Claro', value: '#0066CC' },
    { name: 'Verde', value: '#0B8043' },
    { name: 'Lavanda', value: '#8E24AA' },
    { name: 'Rosa', value: '#E67C73' },
    { name: 'Amarillo', value: '#F6BF26' },
    { name: 'Naranja', value: '#F4511E' },
  ];

  const getEventColor = (event: CalendarEvent) => {
    if (event.color) return event.color;
    if (event.source === 'study_session') return '#8E24AA';
    if (event.provider === 'google') return '#0066CC';
    if (event.provider === 'microsoft') return '#0078D4';
    return '#0A2540';
  };

  // Fecha de hoy (declarada una sola vez)
  const today = moment();

  // Nombres de los días de la semana (para headers de la vista de mes)
  const weekDayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const goToPreviousMonth = () => {
    setCurrentDate(currentDate.clone().subtract(1, 'month'));
  };

  const goToNextMonth = () => {
    setCurrentDate(currentDate.clone().add(1, 'month'));
  };

  const goToToday = () => {
    setCurrentDate(moment());
  };

  // Funciones para vista de semana
  const goToPreviousWeek = () => {
    setCurrentDate(currentDate.clone().subtract(1, 'week'));
  };

  const goToNextWeek = () => {
    setCurrentDate(currentDate.clone().add(1, 'week'));
  };

  // Funciones para vista de día
  const goToPreviousDay = () => {
    setCurrentDate(currentDate.clone().subtract(1, 'day'));
  };

  const goToNextDay = () => {
    setCurrentDate(currentDate.clone().add(1, 'day'));
  };

  // Obtener días de la semana actual (para vista de semana)
  const getWeekDays = () => {
    const startOfWeek = currentDate.clone().startOf('week');
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(startOfWeek.clone().add(i, 'days'));
    }
    return days;
  };

  // Generar horas del día (de 0 a 23)
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Obtener rango de fechas para la semana
  const getWeekRange = () => {
    const startOfWeek = currentDate.clone().startOf('week');
    const endOfWeek = currentDate.clone().endOf('week');
    return {
      start: startOfWeek,
      end: endOfWeek,
    };
  };

  // Calcular datos para la vista de mes
  const getMonthData = () => {
    const startOfMonth = currentDate.clone().startOf('month');
    const endOfMonth = currentDate.clone().endOf('month');
    const daysInMonth = currentDate.daysInMonth();
    const firstDayOfWeek = startOfMonth.day() === 0 ? 7 : startOfMonth.day();

    const days = [];

    // Días del mes anterior
    const daysFromPrevMonth = firstDayOfWeek - 1;
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      const date = startOfMonth.clone().subtract(i + 1, 'days');
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        dayNumber: date.date(),
      });
    }

    // Días del mes actual
    for (let i = 1; i <= daysInMonth; i++) {
      const date = startOfMonth.clone().date(i);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.isSame(today, 'day'),
        dayNumber: i,
      });
    }

    // Días del mes siguiente
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = endOfMonth.clone().add(i, 'days');
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        dayNumber: date.date(),
      });
    }

    return days;
  };

  // Función para cargar eventos del calendario y sesiones de estudio
  const loadEvents = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoadingEvents(true);
    }
    try {
      let startDate: moment.Moment;
      let endDate: moment.Moment;

      if (view === 'month') {
        // Calcular rango de fechas para el mes actual (incluyendo días del mes anterior y siguiente visibles)
        const startOfMonth = currentDate.clone().startOf('month');
        const endOfMonth = currentDate.clone().endOf('month');
        const firstDayOfWeek = startOfMonth.day() === 0 ? 7 : startOfMonth.day();
        const daysFromPrevMonth = firstDayOfWeek - 1;

        // Fecha de inicio: primer día visible en el calendario
        startDate = startOfMonth.clone().subtract(daysFromPrevMonth, 'days');
        // Fecha de fin: último día visible en el calendario (42 días desde startDate)
        endDate = startDate.clone().add(41, 'days');
      } else if (view === 'week') {
        // Calcular rango de fechas para la semana actual
        const weekRange = getWeekRange();
        startDate = weekRange.start.clone().startOf('day');
        endDate = weekRange.end.clone().endOf('day');
      } else if (view === 'day') {
        // Calcular rango de fechas para el día actual
        startDate = currentDate.clone().startOf('day');
        endDate = currentDate.clone().endOf('day');
      } else {
        setIsLoadingEvents(false);
        return;
      }

      // Cargar eventos del calendario externo (Google/Microsoft)
      const calendarEventsResponse = await fetch(
        `/api/study-planner/calendar/events?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );

      let calendarEvents: CalendarEvent[] = [];
      if (calendarEventsResponse.ok) {
        const calendarData = await calendarEventsResponse.json();
        calendarEvents = (calendarData.events || []).map((event: any) => ({
          id: event.id,
          title: event.title,
          description: event.description,
          start: event.start,
          end: event.end,
          location: event.location,
          isAllDay: event.isAllDay,
          provider: calendarData.provider,
          source: 'calendar' as const,
          googleEventId: calendarData.provider === 'google' ? event.id : undefined,
          externalEventId: event.id, // Guardar el ID externo para filtrado (funciona para Google y Microsoft)
        }));
      }

      // Cargar sesiones de estudio
      const studySessionsResponse = await fetch(
        `/api/study-planner/sessions?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );

      let studySessions: CalendarEvent[] = [];
      const studySessionExternalIds = new Set<string>();
      if (studySessionsResponse.ok) {
        const sessionsData = await studySessionsResponse.json();
        studySessions = (sessionsData.sessions || []).map((session: any) => {
          // Guardar external_event_id para filtrar eventos duplicados del calendario externo
          if (session.external_event_id) {
            // Limpiar el ID del evento (puede venir con formato de recurrencia)
            const cleanEventId = String(session.external_event_id).split('_')[0];
            studySessionExternalIds.add(cleanEventId);
          }
          return {
            id: session.id || `study-${session.id}`,
            title: session.title || 'Sesión de estudio',
            description: session.description,
            start: session.start_time,
            end: session.end_time,
            provider: 'study' as const,
            source: 'study_session' as const,
            externalEventId: session.external_event_id || undefined,
          };
        });
      }

      // Cargar eventos personalizados del usuario
      const customEventsResponse = await fetch(
        `/api/study-planner/events?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );

      let customEvents: CalendarEvent[] = [];
      if (customEventsResponse.ok) {
        const customData = await customEventsResponse.json();

        // Mostrar advertencia si PostgREST aún no reconoce la tabla
        if (customData.warning) {
          console.warn('⚠️', customData.warning);
        }

        customEvents = (customData.events || []).map((event: any) => ({
          id: event.id,
          title: event.title,
          description: event.description,
          start: event.start_time,
          end: event.end_time,
          location: event.location,
          isAllDay: event.is_all_day,
          provider: 'local' as const,
          source: 'calendar' as const,
          localEventId: event.id,
          googleEventId: event.google_event_id || undefined,
          color: event.color || undefined,
        }));
      } else if (customEventsResponse.status === 503) {
        // Si el servicio no está disponible (tabla no reconocida por PostgREST)
        const errorData = await customEventsResponse.json().catch(() => ({}));
        console.warn('⚠️ Tabla user_calendar_events no disponible:', errorData.hint || errorData.error);
        customEvents = []; // Continuar con array vacío
      }

      // Filtrar eventos duplicados: si un evento del calendario externo ya está en customEvents, no incluirlo
      const customEventExternalIds = new Set(
        customEvents
          .filter(e => e.googleEventId || e.externalEventId)
          .map(e => {
            // Limpiar el ID del evento (puede venir con formato de recurrencia)
            const eventId = e.googleEventId || e.externalEventId;
            return eventId ? String(eventId).split('_')[0] : null;
          })
          .filter((id): id is string => id !== null)
      );

      // Filtrar eventos del calendario externo que ya están en customEvents o en sesiones de estudio
      const uniqueCalendarEvents = calendarEvents.filter(event => {
        // Limpiar el ID del evento (puede venir con formato de recurrencia)
        const cleanEventId = event.externalEventId
          ? String(event.externalEventId).split('_')[0]
          : (event.googleEventId ? String(event.googleEventId).split('_')[0] : null);

        if (!cleanEventId) {
          return true; // Si no tiene ID externo, incluirlo (evento local)
        }

        // Si el evento tiene un ID externo y ese ID ya está en customEvents, excluirlo
        if (customEventExternalIds.has(cleanEventId)) {
          return false;
        }

        // Si el evento tiene un ID que corresponde a una sesión de estudio, excluirlo
        // (ya se muestra como studySession)
        if (studySessionExternalIds.has(cleanEventId)) {
          return false;
        }

        return true;
      });

      // Combinar todos los eventos sin duplicados
      const combinedEvents = [...uniqueCalendarEvents, ...studySessions, ...customEvents];

      // Guardar todos los eventos sin filtrar
      setAllEvents(combinedEvents);
    } catch (error) {
      console.error('Error cargando eventos:', error);
      setEvents([]);
      setAllEvents([]);
    } finally {
      setIsLoadingEvents(false);
      setIsRefreshing(false);
    }
  }, [currentDate, view]);

  // Función para recarga manual
  const handleManualRefresh = async () => {
    await loadEvents(true);
  };

  // Cargar eventos cuando cambia el mes, la vista, o se dispara un refresh externo
  useEffect(() => {
    loadEvents();
  }, [loadEvents, refreshTrigger]);

  // Recarga automática cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      loadEvents(false);
    }, 5 * 60 * 1000); // 5 minutos en milisegundos

    // Limpiar intervalo cuando el componente se desmonte
    return () => clearInterval(interval);
  }, [loadEvents]);

  // Aplicar filtro cuando cambia showOnlyPlanEvents o allEvents
  useEffect(() => {
    if (showOnlyPlanEvents) {
      // Mostrar solo eventos del plan (study_session)
      setEvents(allEvents.filter(event => event.source === 'study_session'));
    } else {
      // Mostrar todos los eventos
      setEvents(allEvents);
    }
  }, [showOnlyPlanEvents, allEvents]);

  // Funciones para manejar eventos
  const handleEditEvent = () => {
    if (!selectedEvent) return;
    setIsEditMode(true);
    setEventForm({
      title: selectedEvent.title,
      description: selectedEvent.description || '',
      start: selectedEvent.start,
      end: selectedEvent.end,
      location: selectedEvent.location || '',
      isAllDay: selectedEvent.isAllDay || false,
      color: selectedEvent.color || '#0066CC',
    });
  };

  const handleDeleteEvent = () => {
    if (!selectedEvent) return;

    // Mostrar modal de confirmación en lugar de confirm() del navegador
    setConfirmDialog({
      isOpen: true,
      message: '¿Estás seguro de que deseas eliminar este evento?',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        await performDeleteEvent();
      },
      onCancel: () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  const performDeleteEvent = async () => {
    if (!selectedEvent) return;

    setIsDeletingEvent(true);
    try {
      // Usar el ID local si existe, sino usar el ID del evento (puede ser google_event_id)
      const eventId = selectedEvent.localEventId || selectedEvent.id;
      const response = await fetch(`/api/study-planner/events/${eventId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Recargar eventos
        await loadEvents();
        setIsEventModalOpen(false);
        setSelectedEvent(null);
        setToast({
          isOpen: true,
          message: 'Evento eliminado exitosamente',
          type: 'success',
        });
      } else {
        const errorData = await response.json();
        let errorMessage = errorData.error || 'Error al eliminar el evento';

        // Manejar error de permisos insuficientes
        if (errorMessage.includes('insufficient authentication scopes') ||
          (errorMessage.includes('insufficient') && errorMessage.includes('scopes'))) {
          errorMessage = 'Permisos insuficientes. El token actual tiene solo permisos de lectura. Por favor, desconecta y vuelve a conectar tu calendario de Google para obtener permisos de escritura.';
        }

        setToast({
          isOpen: true,
          message: errorMessage,
          type: 'error',
        });
      }
    } catch (error: any) {
      console.error('Error eliminando evento:', error);
      let errorMessage = 'Error al eliminar el evento';

      if (error?.message?.includes('insufficient authentication scopes')) {
        errorMessage = 'Permisos insuficientes. Por favor, reconecta tu calendario de Google con permisos de escritura.';
      }

      setToast({
        isOpen: true,
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setIsDeletingEvent(false);
    }
  };

  const handleSaveEvent = async () => {
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
      let response;
      if (isCreatingEvent) {
        // Crear nuevo evento
        response = await fetch('/api/study-planner/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventForm),
        });
      } else {
        // Editar evento existente
        if (!selectedEvent) return;
        // Usar el ID local si existe, sino usar el ID del evento (puede ser google_event_id)
        const eventId = selectedEvent.localEventId || selectedEvent.id;
        response = await fetch(`/api/study-planner/events/${eventId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventForm),
        });
      }

      if (response.ok) {
        // Recargar eventos
        await loadEvents();
        setIsEditMode(false);
        setIsCreatingEvent(false);
        setIsEventModalOpen(false);
        setSelectedEvent(null);
        setEventForm({
          title: '',
          description: '',
          start: '',
          end: '',
          location: '',
          isAllDay: false,
          color: '#0A2540',
        });
        setToast({
          isOpen: true,
          message: isCreatingEvent ? 'Evento creado exitosamente' : 'Evento actualizado exitosamente',
          type: 'success',
        });
      } else {
        const errorData = await response.json();
        let errorMessage = errorData.error || 'Error al guardar el evento';

        // Manejar error de permisos insuficientes
        if (errorMessage.includes('insufficient authentication scopes') ||
          (errorMessage.includes('insufficient') && errorMessage.includes('scopes'))) {
          errorMessage = 'Permisos insuficientes. Por favor, reconecta tu calendario de Google con permisos de escritura.';
        }

        setToast({
          isOpen: true,
          message: errorMessage,
          type: 'error',
        });
      }
    } catch (error: any) {
      console.error('Error guardando evento:', error);
      let errorMessage = 'Error al guardar el evento';

      if (error?.message?.includes('insufficient authentication scopes')) {
        errorMessage = 'Permisos insuficientes. Por favor, reconecta tu calendario de Google con permisos de escritura.';
      }

      setToast({
        isOpen: true,
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateEvent = () => {
    setIsCreatingEvent(true);
    setIsEditMode(true);
    setSelectedEvent(null);
    // Establecer fecha y hora por defecto basadas en la fecha actual
    const defaultStart = currentDate.clone().hour(9).minute(0).second(0);
    const defaultEnd = currentDate.clone().hour(10).minute(0).second(0);
    setEventForm({
      title: '',
      description: '',
      start: defaultStart.toISOString(),
      end: defaultEnd.toISOString(),
      location: '',
      isAllDay: false,
      color: '#0A2540',
    });
    setIsEventModalOpen(true);
  };

  // Obtener eventos para un día específico
  const getEventsForDay = (date: moment.Moment): CalendarEvent[] => {
    return events.filter((event) => {
      const eventStart = moment(event.start);
      const eventEnd = moment(event.end);

      // Normalizar fechas a medianoche para comparación de días
      const dayStart = date.clone().startOf('day');
      const dayEnd = date.clone().endOf('day');

      // Si el evento es de todo el día, usar solo la fecha
      if (event.isAllDay) {
        const eventStartDay = eventStart.clone().startOf('day');
        const eventEndDay = eventEnd.clone().startOf('day');
        return date.isSameOrAfter(eventStartDay, 'day') && date.isSameOrBefore(eventEndDay, 'day');
      }

      // Para eventos con hora específica, verificar si se superponen con el día
      // El evento se muestra si:
      // - Comienza antes o durante el día Y termina después o durante el día
      return eventStart.isSameOrBefore(dayEnd) && eventEnd.isSameOrAfter(dayStart);
    });
  };

  // Calcular posición y altura de un evento en la vista de semana
  const getEventPosition = (event: CalendarEvent, date: moment.Moment) => {
    if (event.isAllDay) {
      return { top: 0, height: 16, isAllDay: true };
    }

    const eventStart = moment(event.start);
    const eventEnd = moment(event.end);

    // Si el evento no está en este día, no calcular posición
    if (!date.isSame(eventStart, 'day') && !date.isSame(eventEnd, 'day')) {
      // Verificar si está en el rango del día
      const dayStart = date.clone().startOf('day');
      const dayEnd = date.clone().endOf('day');
      if (!(eventStart.isBefore(dayEnd) && eventEnd.isAfter(dayStart))) {
        return null;
      }
    }

    // Calcular minutos desde el inicio del día
    const startMinutes = eventStart.hour() * 60 + eventStart.minute();
    const endMinutes = eventEnd.hour() * 60 + eventEnd.minute();
    const durationMinutes = endMinutes - startMinutes;

    // Cada hora tiene 64px de altura (h-16 = 4rem = 64px)
    const top = (startMinutes / 60) * 64;
    const height = Math.max((durationMinutes / 60) * 64, 20); // Mínimo 20px

    return { top, height, isAllDay: false };
  };

  // Calcular datos según la vista activa
  const monthDays = view === 'month' ? getMonthData() : [];
  const weekDays = view === 'week' ? getWeekDays() : [];
  const weekRange = view === 'week' ? getWeekRange() : null;

  return {
    // State
    currentDate,
    setCurrentDate,
    view,
    setView,
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
    // Derived data
    eventColors,
    today,
    weekDayNames,
    hours,
    monthDays,
    weekDays,
    weekRange,
    // Handlers
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
  };
}
