import type { Moment } from 'moment';

export type ViewType = 'month' | 'week' | 'day';

export interface CalendarEvent {
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

export interface StudyPlannerCalendarProps {
  showOnlyPlanEvents?: boolean;
  refreshTrigger?: number;
}

export interface StudyPlannerCalendarEventForm {
  title: string;
  description: string;
  start: string;
  end: string;
  location: string;
  isAllDay: boolean;
  color: string;
}

export interface StudyPlannerCalendarToastState {
  isOpen: boolean;
  message: string;
  type: 'error' | 'success' | 'info';
}

export interface StudyPlannerCalendarConfirmDialogState {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface StudyPlannerCalendarMonthDay {
  date: Moment;
  isCurrentMonth: boolean;
  isToday: boolean;
  dayNumber: number;
}

export interface StudyPlannerCalendarWeekRange {
  start: Moment;
  end: Moment;
}

export interface StudyPlannerCalendarEventPosition {
  top: number;
  height: number;
  isAllDay: boolean;
}
