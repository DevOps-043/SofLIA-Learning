import type {
  StudyPlannerCalendarConfirmDialogState,
  StudyPlannerCalendarEventForm,
  StudyPlannerCalendarToastState,
} from './study-planner-calendar.types';

export const DEFAULT_EVENT_COLOR = 'var(--color-primary)';

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
  { name: 'Azul Profundo', value: 'var(--color-primary)' },
  { name: 'Aqua', value: 'var(--color-accent)' },
  { name: 'Verde Suave', value: 'var(--color-success)' },
  { name: 'Ambar', value: 'var(--color-warning)' },
  { name: 'Azul Claro', value: 'var(--color-legacy-0066cc)' },
  { name: 'Verde', value: 'var(--color-legacy-0b8043)' },
  { name: 'Lavanda', value: 'var(--color-legacy-8e24aa)' },
  { name: 'Rosa', value: 'var(--color-legacy-e67c73)' },
  { name: 'Amarillo', value: 'var(--color-legacy-f6bf26)' },
  { name: 'Naranja', value: 'var(--color-legacy-f4511e)' },
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
