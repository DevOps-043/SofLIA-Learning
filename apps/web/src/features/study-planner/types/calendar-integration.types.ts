import type { CalendarProvider } from './user-profile.types';
import type { TimeBlock } from './study-preferences.types';

export interface CalendarIntegration {
  id: string;
  userId: string;
  provider: CalendarProvider;
  isConnected: boolean;
  expiresAt?: string;
  scope?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  isRecurring: boolean;
  location?: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  calendarId?: string;
}

export interface CalendarAvailability {
  date: string;
  freeSlots: TimeBlock[];
  busySlots: TimeBlock[];
  totalFreeMinutes: number;
  totalBusyMinutes: number;
}

export interface CalendarListItem {
  id: string;
  name: string;
  isPrimary: boolean;
  isConnectedAccountPrimary?: boolean;
  accessRole: 'owner' | 'writer' | 'reader' | 'freeBusyReader';
  accountEmail?: string;
  color?: string;
  provider: CalendarProvider;
  providerAccountId?: string;
  source?: string;
}

export interface CalendarIntegrationMetadata {
  account_email?: string;
  provider_account_id?: string;
  secondary_calendar_id?: string;
  selected_calendar_ids?: string[];
}
