import type { SessionType, TimeOfDay, CalendarProvider } from './user-profile.types';

export interface TimeBlock {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  dayOfWeek?: number;
}

export interface StudyPreferences {
  id: string;
  userId: string;
  timezone: string;
  preferredTimeOfDay: TimeOfDay;
  preferredDays: number[];
  dailyTargetMinutes: number;
  weeklyTargetMinutes: number;
  preferredSessionType: SessionType;
  minSessionMinutes?: number;
  maxSessionMinutes?: number;
  breakDurationMinutes?: number;
  calendarConnected: boolean;
  calendarProvider?: CalendarProvider;
}
