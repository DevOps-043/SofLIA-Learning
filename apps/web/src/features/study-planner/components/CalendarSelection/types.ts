import type { CalendarListItem } from '../../types/user-context.types';

export interface CalendarSelectionState {
  calendars: CalendarListItem[];
  selectedIds: Set<string>;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  hasChanges: boolean;
  staleWarning: boolean;
}
