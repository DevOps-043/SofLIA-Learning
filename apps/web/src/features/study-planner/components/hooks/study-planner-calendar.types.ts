import type {
  CalendarDate,
  CalendarEvent as SharedCalendarEvent,
  CalendarView as SharedCalendarView,
  ConfirmDialogState,
  EventForm,
} from '../calendar/types';

export type ViewType = SharedCalendarView;

export type CalendarEvent = SharedCalendarEvent & {
  googleEventId?: string;
  localEventId?: string;
  externalEventId?: string;
};

export interface StudyPlannerCalendarProps {
  showOnlyPlanEvents?: boolean;
  refreshTrigger?: number;
}

export type StudyPlannerCalendarEventForm = EventForm;

export interface StudyPlannerCalendarToastState {
  isOpen: boolean;
  message: string;
  type: 'error' | 'success' | 'info';
}

export type StudyPlannerCalendarConfirmDialogState = ConfirmDialogState;

export interface StudyPlannerCalendarMonthDay {
  date: CalendarDate;
  isCurrentMonth: boolean;
  isToday: boolean;
  dayNumber: number;
}

export interface StudyPlannerCalendarWeekRange {
  start: CalendarDate;
  end: CalendarDate;
}

export interface StudyPlannerCalendarEventPosition {
  top: number;
  height: number;
  left: number;
  width: number;
  zIndex?: number;
  isAllDay: boolean;
}
