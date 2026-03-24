'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X, MapPin, Clock, Calendar as CalendarIcon, Edit2, Trash2, Plus, Save, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment';
import 'moment/locale/es';
import { ToastNotification } from '@/core/components/ToastNotification/ToastNotification';

// Configurar moment en español
moment.locale('es', {
  week: {
    dow: 1, // Lunes como primer día de la semana
  },
});

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
  googleEventId?: string; // ID del evento en Google Calendar
  localEventId?: string; // ID del evento en nuestra base de datos
  externalEventId?: string; // ID del evento externo (para sesiones de estudio)
  color?: string; // Color personalizado del evento
}

interface StudyPlannerCalendarProps {
  showOnlyPlanEvents?: boolean;
  refreshTrigger?: number;
}

export function StudyPlannerCalendar({ showOnlyPlanEvents = false, refreshTrigger = 0 }: StudyPlannerCalendarProps) {
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
    { name: 'Ãmbar', value: '#F59E0B' },
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
          console.warn('âš ï¸', customData.warning);
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
        console.warn('âš ï¸ Tabla user_calendar_events no disponible:', errorData.hint || errorData.error);
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

  if (!isMounted) {
    return null;
  }

  const monthDays = view === 'month' ? getMonthData() : [];
  const weekDays = view === 'week' ? getWeekDays() : [];
  const weekRange = view === 'week' ? getWeekRange() : null;

  return (
    <div className="h-full w-full flex flex-col max-w-[100vw] overflow-x-hidden">
      {/* Header del Calendario - Estilo Google Calendar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 pb-3 border-b border-[#E9ECEF] dark:border-[#6C757D]/30 gap-4 sm:gap-0">
        {/* Título del mes/año, rango de semana o día */}
        <h2 className="text-xl font-semibold text-[#0A2540] dark:text-white truncate max-w-full">
          {view === 'month'
            ? currentDate.format('MMMM YYYY')
            : view === 'week'
              ? weekRange ? `${weekRange.start.format('D MMM')} - ${weekRange.end.format('D MMM YYYY')}` : ''
              : currentDate.format('dddd, D [de] MMMM [de] YYYY')
          }
        </h2>

        {/* Controles de navegación y vista */}
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end overflow-x-auto no-scrollbar">
          {/* Botón para crear evento */}
          <button
            onClick={handleCreateEvent}
            className="px-3 sm:px-4 py-2 text-sm font-medium text-white bg-[#0A2540] hover:bg-[#0d2f4d] rounded-lg transition-colors flex items-center gap-2 flex-shrink-0"
            title="Crear evento"
          >
            <Plus className="w-5 h-5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Crear evento</span>
          </button>

          {/* Selector de vista */}
          <div className="flex items-center gap-1 bg-[#E9ECEF]/50 dark:bg-[#0A2540]/5 rounded-lg p-1">
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${view === 'month'
                ? 'bg-[#0A2540] dark:bg-[#0A2540] text-white shadow-sm'
                : 'text-[#0A2540] dark:text-[#00D4B3] hover:text-white hover:bg-[#0A2540]/80 dark:hover:bg-[#00D4B3]/80'
                }`}
            >
              Mes
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${view === 'week'
                ? 'bg-[#0A2540] dark:bg-[#0A2540] text-white shadow-sm'
                : 'text-[#0A2540] dark:text-[#00D4B3] hover:text-white hover:bg-[#0A2540]/80 dark:hover:bg-[#00D4B3]/80'
                }`}
            >
              Semana
            </button>
            <button
              onClick={() => setView('day')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${view === 'day'
                ? 'bg-[#0A2540] dark:bg-[#0A2540] text-white shadow-sm'
                : 'text-[#0A2540] dark:text-[#00D4B3] hover:text-white hover:bg-[#0A2540]/80 dark:hover:bg-[#00D4B3]/80'
                }`}
            >
              Día
            </button>
          </div>

          {/* Controles de navegación */}
          <div className="flex items-center gap-2">
            <motion.button
              layout
              onClick={handleManualRefresh}
              disabled={isRefreshing || isLoadingEvents}
              onMouseEnter={() => setHoveredRefreshButton(true)}
              onMouseLeave={() => setHoveredRefreshButton(false)}
              whileTap={{ scale: 0.95 }}
              className="rounded-lg bg-white dark:bg-[#1E2329] text-[#6C757D] dark:text-gray-400 hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20 border border-[#E9ECEF] dark:border-[#6C757D]/30 transition-colors flex items-center overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Recargar calendario"
              title="Recargar calendario"
            >
              <motion.div
                className="p-2.5 flex-shrink-0 flex items-center justify-center"
                animate={isRefreshing ? {
                  rotate: 360,
                } : hoveredRefreshButton ? {
                  rotate: 360,
                } : {}}
                transition={{
                  duration: isRefreshing ? 1 : 1,
                  repeat: isRefreshing || hoveredRefreshButton ? Infinity : 0,
                  ease: 'linear'
                }}
              >
                <RefreshCw className="w-5 h-5" />
              </motion.div>
              <AnimatePresence>
                {hoveredRefreshButton && !isRefreshing && (
                  <motion.span
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 'auto', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="pr-3 whitespace-nowrap text-sm font-medium overflow-hidden inline-block"
                  >
                    Recargar
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-xs font-medium text-[#0A2540] dark:text-white hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20 rounded-md transition-colors"
            >
              Hoy
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={
                  view === 'month'
                    ? goToPreviousMonth
                    : view === 'week'
                      ? goToPreviousWeek
                      : goToPreviousDay
                }
                className="p-2 text-[#6C757D] dark:text-gray-400 hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20 rounded-md transition-colors"
                aria-label={
                  view === 'month'
                    ? 'Mes anterior'
                    : view === 'week'
                      ? 'Semana anterior'
                      : 'Día anterior'
                }
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={
                  view === 'month'
                    ? goToNextMonth
                    : view === 'week'
                      ? goToNextWeek
                      : goToNextDay
                }
                className="p-2 text-[#6C757D] dark:text-gray-400 hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20 rounded-md transition-colors"
                aria-label={
                  view === 'month'
                    ? 'Mes siguiente'
                    : view === 'week'
                      ? 'Semana siguiente'
                      : 'Día siguiente'
                }
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido del Calendario según la vista */}
      {view === 'month' && (
        /* Vista de Mes */
        <div className="flex-1 flex flex-col border-x-0 sm:border border-y sm:border-y border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-none sm:rounded-lg overflow-hidden bg-white dark:bg-[#1E2329] w-full max-w-full">
          <div className="flex-1 flex flex-col w-full min-w-0">
            <div className="flex-1 flex flex-col w-full min-w-0">
              {/* Headers de días de la semana */}
              <div className="grid grid-cols-7 border-b border-[#E9ECEF] dark:border-[#6C757D]/30">
                {weekDayNames.map((day, index) => (
                  <div
                    key={index}
                    className="py-1 text-[9px] sm:text-xs font-medium text-[#6C757D] dark:text-gray-400 uppercase tracking-wider text-center border-r border-[#E9ECEF] dark:border-[#6C757D]/30 last:border-r-0 truncate overflow-hidden"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Días del calendario */}
              <div className="flex-1 grid grid-cols-7 auto-rows-fr">
                {monthDays.map((dayInfo, index) => {
                  const isCurrentMonth = dayInfo.isCurrentMonth;
                  const isToday = dayInfo.isToday;

                  // Calcular eventos para este día
                  const dayEvents = getEventsForDay(dayInfo.date);
                  const MAX_EVENTS_TO_SHOW = 3;
                  const eventsToDisplay = dayEvents.slice(0, MAX_EVENTS_TO_SHOW);
                  const moreCount = dayEvents.length - MAX_EVENTS_TO_SHOW;

                  return (
                    <div
                      onClick={(e) => {
                        // Solo permitir crear evento si es clic directo al fondo
                        if (e.target === e.currentTarget) {
                          setCurrentDate(dayInfo.date);
                          handleCreateEvent();
                        }
                      }}
                      key={index}
                      className={`
                    min-h-[60px] sm:min-h-[120px] p-0.5 sm:p-2 border-r border-b border-[#E9ECEF] dark:border-[#6C757D]/30 relative transition-colors
                    ${isCurrentMonth ? 'bg-white dark:bg-[#1E2329]' : 'bg-gray-50/50 dark:bg-[#1E2329]/50'}
                    ${isToday ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}
                    ${(index + 1) % 7 === 0 ? 'border-r-0' : ''}
                    hover:bg-gray-50 dark:hover:bg-[#2C333A] cursor-pointer flex flex-col items-center sm:items-stretch overflow-hidden min-w-0
                  `}
                    >
                      {/* Número del día */}
                      <div className="flex justify-between items-start mb-1">
                        <span
                          className={`
                        text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full
                        ${isToday
                              ? 'bg-[#0A2540] text-white shadow-sm'
                              : isCurrentMonth
                                ? 'text-[#0A2540] dark:text-gray-300'
                                : 'text-gray-400 dark:text-gray-600'
                            }
                      `}
                        >
                          {dayInfo.date.format('D')}
                        </span>
                      </div>

                      {/* Lista de eventos (Badges) - Visible en todas las pantallas */}
                      <div className="flex flex-col gap-0.5 sm:gap-1 w-full overflow-hidden">
                        {eventsToDisplay.map((event) => {
                          const eventColor = getEventColor(event);
                          return (
                            <div
                              key={event.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEvent(event);
                                setIsEventModalOpen(true);
                              }}
                              className="px-0.5 sm:px-2 py-0 sm:py-0.5 rounded-[2px] sm:rounded text-[8px] sm:text-[10px] font-medium truncate border-l-[1px] sm:border-l-[3px] cursor-pointer transition-all duration-200 hover:opacity-80 hover:shadow-sm text-white leading-tight min-w-0"
                              style={{
                                backgroundColor: eventColor,
                                borderColor: eventColor,
                              }}
                              title={`${event.title}${event.isAllDay ? ' (Todo el día)' : ''}`}
                            >
                              {event.title}
                            </div>
                          );
                        })}
                        {moreCount > 0 && (
                          <div className="text-[8px] sm:text-[10px] text-gray-500 font-medium pl-1">
                            +{moreCount} más
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
      {view === 'week' && (
        /* Vista de Semana - Estilo Google Calendar */
        <div className="flex-1 flex flex-col border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-lg overflow-hidden bg-white dark:bg-[#1E2329] w-full max-w-full">
          <div className="flex-1 flex flex-col overflow-x-auto touch-pan-x w-full">
            <div className="flex-1 flex flex-col min-w-[800px]">
              {/* Headers de días de la semana */}
              <div className="flex border-b border-[#E9ECEF] dark:border-[#6C757D]/30">
                {/* Celda vacía para la columna de horas - Ancho fijo estrecho */}
                <div className="w-16 border-r border-[#E9ECEF] dark:border-[#6C757D]/30 flex-shrink-0"></div>

                {/* Headers de días - Flex para distribuir el espacio restante */}
                <div className="flex flex-1">
                  {weekDays.map((day, index) => {
                    const dayDate = weekDays[index];
                    const isToday = dayDate.isSame(today, 'day');

                    return (
                      <div
                        key={index}
                        className="flex-1 px-3 py-3 border-r border-[#E9ECEF] dark:border-[#6C757D]/30 last:border-r-0"
                      >
                        <div className="text-center">
                          <div className="text-xs font-medium text-[#6C757D] dark:text-gray-400 uppercase tracking-wider mb-1">
                            {dayDate.format('ddd')}
                          </div>
                          <div
                            className={`
                          w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm font-medium
                          ${isToday
                                ? 'bg-[#0A2540] text-white' /* Azul Profundo */
                                : 'text-[#0A2540] dark:text-white'
                              }
                        `}
                          >
                            {dayDate.format('D')}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Grid de horas y días */}
              <div className="flex-1 overflow-y-auto">
                <div className="flex">
                  {/* Columna de horas - Ancho fijo estrecho */}
                  <div className="w-16 border-r border-[#E9ECEF] dark:border-[#6C757D]/30 flex-shrink-0">
                    {hours.map((hour) => (
                      <div
                        key={hour}
                        className="h-16 border-b border-[#E9ECEF] dark:border-[#6C757D]/30 px-1.5 flex items-start justify-end pt-1"
                      >
                        <span className="text-xs text-[#6C757D] dark:text-gray-400">
                          {hour.toString().padStart(2, '0')}:00
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Columnas de días - Flex para distribuir el espacio restante */}
                  <div className="flex flex-1 relative">
                    {weekDays.map((dayDate, dayIndex) => {
                      const isToday = dayDate.isSame(today, 'day');
                      const dayEvents = getEventsForDay(dayDate);

                      return (
                        <div
                          key={dayIndex}
                          className={`
                        flex-1 border-r border-[#E9ECEF] dark:border-[#6C757D]/30 last:border-r-0 relative
                        ${isToday ? 'bg-[#0A2540]/10 dark:bg-[#0A2540]/20' : ''}
                      `}
                        >
                          {/* Grid de horas para estructura */}
                          {hours.map((hour) => (
                            <div
                              key={hour}
                              className="h-16 border-b border-[#E9ECEF] dark:border-[#6C757D]/30 relative hover:bg-[#E9ECEF]/30 dark:hover:bg-[#0A2540]/10 transition-colors"
                            />
                          ))}

                          {/* Eventos posicionados absolutamente */}
                          {dayEvents.map((event) => {
                            const position = getEventPosition(event, dayDate);
                            if (!position) return null;

                            const isStudySession = event.source === 'study_session';
                            const isGoogle = event.provider === 'google';
                            const isMicrosoft = event.provider === 'microsoft';

                            // Usar color personalizado si existe
                            const eventColor = event.color ||
                              (isStudySession ? '#8E24AA' :
                                isGoogle ? '#0066CC' :
                                  isMicrosoft ? '#0078D4' : '#0066CC');

                            if (position.isAllDay) {
                              // Eventos de todo el día en la parte superior
                              return (
                                <div
                                  key={event.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEvent(event);
                                    setIsEventModalOpen(true);
                                  }}
                                  className="absolute top-0 left-0 right-0 px-2.5 py-1 text-xs font-medium rounded-md border-l-[3px] cursor-pointer transition-all duration-200 z-10 mx-1 mb-1 hover:opacity-90 hover:shadow-md text-white"
                                  style={{
                                    backgroundColor: eventColor,
                                    borderColor: eventColor,
                                  }}
                                  title={event.title}
                                >
                                  {event.title}
                                </div>
                              );
                            }

                            return (
                              <div
                                key={event.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEvent(event);
                                  setIsEventModalOpen(true);
                                }}
                                style={{
                                  top: `${position.top}px`,
                                  height: `${position.height}px`,
                                  backgroundColor: eventColor,
                                  borderColor: eventColor,
                                }}
                                className="absolute left-0 right-0 px-2.5 py-1.5 text-xs font-medium rounded-md border-l-[3px] cursor-pointer transition-all duration-200 z-10 mx-1.5 overflow-hidden hover:opacity-90 hover:shadow-md min-h-[24px] text-white"
                                title={`${event.title} - ${moment(event.start).format('h:mm A')} - ${moment(event.end).format('h:mm A')}`}
                              >
                                <div className="font-semibold truncate leading-tight">{event.title}</div>
                                {position.height > 35 && (
                                  <div className="text-[10px] opacity-90 truncate mt-0.5 leading-tight">
                                    {moment(event.start).format('h:mm A')} - {moment(event.end).format('h:mm A')}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {view === 'day' && (
        /* Vista de Día - Estilo Google Calendar */
        <div className="flex-1 flex flex-col border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-lg overflow-hidden bg-white dark:bg-[#1E2329]">
          {/* Header del día */}
          <div className="flex border-b border-[#E9ECEF] dark:border-[#6C757D]/30">
            {/* Celda vacía para la columna de horas - Ancho fijo estrecho */}
            <div className="w-16 border-r border-[#E9ECEF] dark:border-[#6C757D]/30 flex-shrink-0"></div>

            {/* Header del día - Ocupa todo el espacio restante */}
            <div className="flex-1 px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-[#6C757D] dark:text-gray-400 uppercase tracking-wider mb-1">
                    {currentDate.format('dddd')}
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center text-base font-medium
                        ${currentDate.isSame(today, 'day')
                          ? 'bg-[#0A2540] text-white'
                          : 'text-[#0A2540] dark:text-white'
                        }
                      `}
                    >
                      {currentDate.format('D')}
                    </div>
                    <span className="text-sm text-[#6C757D] dark:text-gray-400">
                      {currentDate.format('MMMM YYYY')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grid de horas y día */}
          <div className="flex-1 overflow-y-auto">
            <div className="flex">
              {/* Columna de horas - Ancho fijo estrecho */}
              <div className="w-16 border-r border-[#E9ECEF] dark:border-[#6C757D]/30 flex-shrink-0">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="h-16 border-b border-[#E9ECEF] dark:border-[#6C757D]/30 px-1.5 flex items-start justify-end pt-1"
                  >
                    <span className="text-xs text-[#6C757D] dark:text-gray-400">
                      {hour.toString().padStart(2, '0')}:00
                    </span>
                  </div>
                ))}
              </div>

              {/* Columna del día - Ocupa todo el espacio restante */}
              <div
                className={`
                  flex-1 relative
                  ${currentDate.isSame(today, 'day') ? 'bg-[#0A2540]/10 dark:bg-[#0A2540]/20' : ''}
                `}
              >
                {/* Grid de horas para estructura */}
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="h-16 border-b border-[#E9ECEF] dark:border-[#6C757D]/30 relative hover:bg-[#E9ECEF]/30 dark:hover:bg-[#0A2540]/10 transition-colors"
                  />
                ))}

                {/* Eventos posicionados absolutamente */}
                {(() => {
                  const dayEvents = getEventsForDay(currentDate);
                  return dayEvents.map((event) => {
                    const position = getEventPosition(event, currentDate);
                    if (!position) return null;

                    const isStudySession = event.source === 'study_session';
                    const isGoogle = event.provider === 'google';
                    const isMicrosoft = event.provider === 'microsoft';

                    // Usar color personalizado si existe
                    const eventColor = event.color ||
                      (isStudySession ? '#8E24AA' :
                        isGoogle ? '#0066CC' :
                          isMicrosoft ? '#0078D4' : '#0066CC');

                    if (position.isAllDay) {
                      // Eventos de todo el día en la parte superior
                      return (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(event);
                            setIsEventModalOpen(true);
                          }}
                          className="absolute top-0 left-0 right-0 px-2.5 py-1 text-xs font-medium rounded-md border-l-[3px] cursor-pointer transition-all duration-200 z-10 mx-1 mb-1 hover:opacity-90 hover:shadow-md text-white"
                          style={{
                            backgroundColor: eventColor,
                            borderColor: eventColor,
                          }}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(event);
                          setIsEventModalOpen(true);
                        }}
                        style={{
                          top: `${position.top}px`,
                          height: `${position.height}px`,
                          backgroundColor: eventColor,
                          borderColor: eventColor,
                        }}
                        className="absolute left-0 right-0 px-2.5 py-1.5 text-xs font-medium rounded-md border-l-[3px] cursor-pointer transition-all duration-200 z-10 mx-1.5 overflow-hidden hover:opacity-90 hover:shadow-md min-h-[24px] text-white"
                        title={`${event.title} - ${moment(event.start).format('h:mm A')} - ${moment(event.end).format('h:mm A')}`}
                      >
                        <div className="font-semibold truncate leading-tight">{event.title}</div>
                        {position.height > 35 && (
                          <div className="text-[10px] opacity-90 truncate mt-0.5 leading-tight">
                            {moment(event.start).format('h:mm A')} - {moment(event.end).format('h:mm A')}
                          </div>
                        )}
                        {position.height > 50 && event.description && (
                          <div className="text-[10px] opacity-80 truncate mt-1 leading-tight line-clamp-2">
                            {event.description}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalle de Evento */}
      <AnimatePresence>
        {isEventModalOpen && (selectedEvent || isCreatingEvent) && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isEditMode && !isCreatingEvent) {
                  setIsEventModalOpen(false);
                  setSelectedEvent(null);
                }
              }}
              className="fixed inset-0 bg-[#0F1419]/80 backdrop-blur-sm z-50 transition-opacity"
            />

            {/* Modal Container - Bottom Sheet on Mobile, Centered on Desktop */}
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
              <motion.div
                initial={{ y: "100%", opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: "100%", opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="
                  pointer-events-auto
                  bg-white dark:bg-[#1E2329] 
                  w-full sm:max-w-xl 
                  rounded-t-2xl sm:rounded-xl 
                  shadow-2xl overflow-hidden 
                  border-t sm:border border-[#E9ECEF] dark:border-[#6C757D]/30
                  max-h-[90vh] sm:max-h-[85vh]
                  flex flex-col
                "
              >
                {/* Header mejorado - Estilo Google Calendar */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#E9ECEF] dark:border-[#6C757D]/30">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {!isEditMode && !isCreatingEvent && selectedEvent && (
                      <>
                        <button
                          onClick={handleEditEvent}
                          className="p-2 hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20 rounded-lg transition-colors"
                          aria-label="Editar"
                        >
                          <Edit2 className="w-5 h-5 text-[#6C757D] dark:text-gray-400" />
                        </button>
                        <button
                          onClick={handleDeleteEvent}
                          disabled={isDeletingEvent}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="w-5 h-5 text-red-500 dark:text-red-400" />
                        </button>
                      </>
                    )}
                    <h2 className="text-lg font-semibold text-[#0A2540] dark:text-white flex-1 truncate">
                      {isCreatingEvent ? 'Nuevo evento' : selectedEvent?.title || ''}
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      setIsEventModalOpen(false);
                      setSelectedEvent(null);
                      setIsEditMode(false);
                      setIsCreatingEvent(false);
                      setEventForm({
                        title: '',
                        description: '',
                        start: '',
                        end: '',
                        location: '',
                        isAllDay: false,
                        color: '#0A2540',
                      });
                    }}
                    className="p-2 hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20 rounded-lg transition-colors"
                    aria-label="Cerrar"
                  >
                    <X className="w-5 h-5 text-[#6C757D] dark:text-gray-400" />
                  </button>
                </div>

                {/* Contenido del Modal - Mejorado */}
                <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1 overscroll-contain">
                  {isEditMode || isCreatingEvent ? (
                    /* Formulario de Edición/Creación - Mejorado */
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveEvent();
                      }}
                      className="space-y-5"
                    >
                      {/* Título - Mejorado */}
                      <div>
                        <input
                          type="text"
                          value={eventForm.title}
                          onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                          placeholder="Añadir título"
                          className="w-full px-4 py-2.5 text-base font-medium bg-white dark:bg-[#1E2329] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-lg text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00D4B3] focus:border-transparent transition-all"
                          required
                          autoFocus
                        />
                      </div>

                      {/* Fecha y Hora - Mejorado */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-[#6C757D] dark:text-gray-500 flex-shrink-0" />
                          <div className="flex-1 grid grid-cols-2 gap-3">
                            {!eventForm.isAllDay ? (
                              <>
                                <div>
                                  <label className="block text-xs font-medium text-[#6C757D] dark:text-gray-400 mb-1.5">
                                    Inicio
                                  </label>
                                  <input
                                    type="datetime-local"
                                    value={moment(eventForm.start).format('YYYY-MM-DDTHH:mm')}
                                    onChange={(e) => {
                                      const newStart = moment(e.target.value).toISOString();
                                      setEventForm({ ...eventForm, start: newStart });
                                    }}
                                    className="w-full px-3 py-2 text-sm border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-lg bg-white dark:bg-[#1E2329] text-[#0A2540] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00D4B3] focus:border-transparent transition-all"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-[#6C757D] dark:text-gray-400 mb-1.5">
                                    Fin
                                  </label>
                                  <input
                                    type="datetime-local"
                                    value={moment(eventForm.end).format('YYYY-MM-DDTHH:mm')}
                                    onChange={(e) => {
                                      const newEnd = moment(e.target.value).toISOString();
                                      setEventForm({ ...eventForm, end: newEnd });
                                    }}
                                    className="w-full px-3 py-2 text-sm border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-lg bg-white dark:bg-[#1E2329] text-[#0A2540] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00D4B3] focus:border-transparent transition-all"
                                    required
                                  />
                                </div>
                              </>
                            ) : (
                              <>
                                <div>
                                  <label className="block text-xs font-medium text-[#6C757D] dark:text-gray-400 mb-1.5">
                                    Fecha inicio
                                  </label>
                                  <input
                                    type="date"
                                    value={moment(eventForm.start).format('YYYY-MM-DD')}
                                    onChange={(e) => {
                                      const newStart = moment(e.target.value).startOf('day').toISOString();
                                      setEventForm({ ...eventForm, start: newStart });
                                    }}
                                    className="w-full px-3 py-2 text-sm border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-lg bg-white dark:bg-[#1E2329] text-[#0A2540] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00D4B3] focus:border-transparent transition-all"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-[#6C757D] dark:text-gray-400 mb-1.5">
                                    Fecha fin
                                  </label>
                                  <input
                                    type="date"
                                    value={moment(eventForm.end).format('YYYY-MM-DD')}
                                    onChange={(e) => {
                                      const newEnd = moment(e.target.value).endOf('day').toISOString();
                                      setEventForm({ ...eventForm, end: newEnd });
                                    }}
                                    className="w-full px-3 py-2 text-sm border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-lg bg-white dark:bg-[#1E2329] text-[#0A2540] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00D4B3] focus:border-transparent transition-all"
                                    required
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Checkbox Todo el día - Mejorado */}
                        <div className="flex items-center gap-3 pl-8">
                          <input
                            type="checkbox"
                            id="isAllDay"
                            checked={eventForm.isAllDay}
                            onChange={(e) => setEventForm({ ...eventForm, isAllDay: e.target.checked })}
                            className="w-5 h-5 text-[#0A2540] border-[#E9ECEF] dark:border-[#6C757D] rounded-lg focus:ring-2 focus:ring-[#00D4B3] bg-white dark:bg-[#1E2329]"
                          />
                          <label htmlFor="isAllDay" className="text-sm font-medium text-[#0A2540] dark:text-white cursor-pointer">
                            Todo el día
                          </label>
                        </div>
                      </div>

                      {/* Ubicación - Mejorado */}
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-[#6C757D] dark:text-gray-500 flex-shrink-0 mt-2.5" />
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-[#6C757D] dark:text-gray-400 mb-1.5">
                            Ubicación
                          </label>
                          <input
                            type="text"
                            value={eventForm.location}
                            onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                            placeholder="Añadir ubicación"
                            className="w-full px-3 py-2 text-sm border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-lg bg-white dark:bg-[#1E2329] text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00D4B3] focus:border-transparent transition-all"
                          />
                        </div>
                      </div>

                      {/* Descripción - Mejorado */}
                      <div className="flex items-start gap-3">
                        <CalendarIcon className="w-5 h-5 text-[#6C757D] dark:text-gray-500 flex-shrink-0 mt-2.5" />
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-[#6C757D] dark:text-gray-400 mb-1.5">
                            Descripción
                          </label>
                          <textarea
                            value={eventForm.description}
                            onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                            placeholder="Añadir descripción"
                            rows={4}
                            className="w-full px-3 py-2 text-sm border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-lg bg-white dark:bg-[#1E2329] text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00D4B3] focus:border-transparent transition-all resize-none"
                          />
                        </div>
                      </div>

                      {/* Selector de Color - Mejorado */}
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 flex-shrink-0 mt-2.5 flex items-center justify-center">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: eventForm.color }}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-[#6C757D] dark:text-gray-400 mb-2">
                            Color
                          </label>
                          <div className="flex items-center gap-2.5 flex-wrap">
                            {eventColors.map((color) => (
                              <button
                                key={color.value}
                                type="button"
                                onClick={() => setEventForm({ ...eventForm, color: color.value })}
                                className={`
                                  w-9 h-9 rounded-lg transition-all shadow-sm
                                  ${eventForm.color === color.value
                                    ? 'ring-2 ring-offset-2 ring-[#0A2540] dark:ring-[#00D4B3] scale-110 shadow-md'
                                    : 'hover:scale-105 hover:shadow-md'
                                  }
                                `}
                                style={{ backgroundColor: color.value }}
                                title={color.name}
                                aria-label={color.name}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Botones de acción - Mejorados */}
                      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E9ECEF] dark:border-[#6C757D]/30">
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditMode(false);
                            setIsCreatingEvent(false);
                            setEventForm({
                              title: '',
                              description: '',
                              start: '',
                              end: '',
                              location: '',
                              isAllDay: false,
                              color: '#0A2540',
                            });
                            if (!selectedEvent) {
                              setIsEventModalOpen(false);
                            }
                          }}
                          className="px-5 py-2 text-xs font-medium text-[#6C757D] dark:text-gray-400 hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20 rounded-md transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition-all flex items-center gap-2 shadow-md hover:shadow-lg hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                          style={{ backgroundColor: eventForm.color }}
                        >
                          {isSaving ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Guardando...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              {isCreatingEvent ? 'Crear evento' : 'Guardar cambios'}
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* Vista de Detalle - Mejorada */
                    <>
                      {/* Indicador de color y título */}
                      <div className="flex items-start gap-4 mb-4">
                        <div
                          className="w-5 h-5 rounded-lg flex-shrink-0 mt-0.5 shadow-sm"
                          style={{
                            backgroundColor: selectedEvent?.color ||
                              (selectedEvent?.source === 'study_session' ? '#0A2540' :
                                selectedEvent?.provider === 'google' ? '#0066CC' :
                                  selectedEvent?.provider === 'microsoft' ? '#0078D4' : '#0A2540')
                          }}
                        />
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-[#0A2540] dark:text-white mb-1">
                            {selectedEvent?.title}
                          </h3>
                          {selectedEvent?.source === 'study_session' && (
                            <span className="inline-block px-2 py-0.5 text-xs font-medium text-[#0A2540] dark:text-[#00D4B3] bg-[#0A2540]/10 dark:bg-[#0A2540]/20 rounded-md">
                              Sesión de estudio
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Fecha y Hora - Mejorado */}
                      {selectedEvent && (
                        <div className="flex items-start gap-3">
                          <Clock className="w-5 h-5 text-[#6C757D] dark:text-gray-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            {selectedEvent.isAllDay ? (
                              <div className="text-sm text-[#0A2540] dark:text-white">
                                <div className="font-semibold mb-1">Todo el día</div>
                                <div className="text-[#6C757D] dark:text-gray-400">
                                  {moment(selectedEvent.start).format('dddd, D [de] MMMM [de] YYYY')}
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-[#0A2540] dark:text-white">
                                <div className="font-semibold mb-1">
                                  {moment(selectedEvent.start).format('dddd, D [de] MMMM [de] YYYY')}
                                </div>
                                <div className="text-[#6C757D] dark:text-gray-400">
                                  {moment(selectedEvent.start).format('h:mm A')} - {moment(selectedEvent.end).format('h:mm A')}
                                </div>
                                {moment(selectedEvent.start).format('YYYY-MM-DD') !== moment(selectedEvent.end).format('YYYY-MM-DD') && (
                                  <div className="text-[#6C757D] dark:text-gray-400 text-xs mt-1">
                                    Hasta {moment(selectedEvent.end).format('dddd, D [de] MMMM [de] YYYY')}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Ubicación - Mejorado */}
                      {selectedEvent?.location && (
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-[#6C757D] dark:text-gray-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-[#0A2540] dark:text-white">
                              {selectedEvent.location}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Descripción - Mejorado */}
                      {selectedEvent?.description && (
                        <div className="flex items-start gap-3">
                          <CalendarIcon className="w-5 h-5 text-[#6C757D] dark:text-gray-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="text-sm text-[#0A2540] dark:text-white whitespace-pre-wrap leading-relaxed">
                              {selectedEvent.description}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Información del proveedor - Mejorado */}
                      {selectedEvent && (
                        <div className="pt-4 border-t border-[#E9ECEF] dark:border-[#6C757D]/30">
                          <div className="text-xs font-medium text-[#6C757D] dark:text-gray-400">
                            {selectedEvent.provider === 'google' && 'Sincronizado desde Google Calendar'}
                            {selectedEvent.provider === 'microsoft' && 'Sincronizado desde Microsoft Calendar'}
                            {selectedEvent.provider === 'study' && 'Sesión de estudio planificada'}
                            {selectedEvent.provider === 'local' && 'Evento personalizado'}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <ToastNotification
        isOpen={toast.isOpen}
        onClose={() => setToast({ ...toast, isOpen: false })}
        message={toast.message}
        type={toast.type}
        duration={toast.type === 'error' ? 6000 : 4000}
      />

      {/* Modal de Confirmación */}
      <AnimatePresence>
        {confirmDialog.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                confirmDialog.onCancel();
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#1E2329] rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-[#E9ECEF] dark:border-[#6C757D]/30"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-[#E9ECEF] dark:border-[#6C757D]/30">
                <h3 className="text-base font-semibold text-[#0A2540] dark:text-white">
                  Confirmar eliminación
                </h3>
              </div>

              {/* Contenido */}
              <div className="px-5 py-4">
                <p className="text-sm text-[#6C757D] dark:text-gray-300">
                  {confirmDialog.message}
                </p>
              </div>

              {/* Botones */}
              <div className="px-5 py-4 border-t border-[#E9ECEF] dark:border-[#6C757D]/30 flex items-center justify-end gap-3">
                <button
                  onClick={confirmDialog.onCancel}
                  className="px-5 py-2 text-xs font-semibold text-[#6C757D] dark:text-gray-400 hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20 rounded-md transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  disabled={isDeletingEvent}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeletingEvent ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    'Eliminar'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

