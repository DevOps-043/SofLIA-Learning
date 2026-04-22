import type {
  StudyPlannerCalendarConfirmDialogState,
  StudyPlannerCalendarEventForm,
  StudyPlannerCalendarToastState,
} from './study-planner-calendar.types';

export const DEFAULT_EVENT_COLOR = '#0A2540';

export const DEFAULT_EVENT_FORM: StudyPlannerCalendarEventForm = {
  title: '',
  description: '',
  start: '',
  end: '',
  location: '',
  isAllDay: false,
  color: DEFAULT_EVENT_COLOR,
};

export const DEFAULT_TOAST: StudyPlannerCalendarToastState = {
  isOpen: false,
  message: '',
  type: 'error',
};

export const DEFAULT_CONFIRM_DIALOG: StudyPlannerCalendarConfirmDialogState = {
  isOpen: false,
  message: '',
  onConfirm: () => {},
  onCancel: () => {},
};

export const STUDY_PLANNER_WEEK_STARTS_ON = 0;

export const STUDY_PLANNER_EVENT_COLORS = [
  { name: 'Azul Profundo', value: '#0A2540' },
  { name: 'Aqua', value: '#00D4B3' },
  { name: 'Verde Suave', value: '#10B981' },
  { name: 'Ambar', value: '#F59E0B' },
  { name: 'Azul Claro', value: '#0066CC' },
  { name: 'Verde', value: '#0B8043' },
  { name: 'Lavanda', value: '#8E24AA' },
  { name: 'Rosa', value: '#E67C73' },
  { name: 'Amarillo', value: '#F6BF26' },
  { name: 'Naranja', value: '#F4511E' },
];

export const STUDY_PLANNER_WEEKDAY_NAMES = [
  'Dom',
  'Lun',
  'Mar',
  'Mie',
  'Jue',
  'Vie',
  'Sab',
];

export const STUDY_PLANNER_HOURS = Array.from({ length: 24 }, (_, index) => index);
