/**
 * CalendarIntegrationService
 *
 * Servicio para integrar y analizar calendarios de Google y Microsoft
 * para el planificador de estudios.
 *
 * This file is the public API surface for calendar integration.
 * Implementation is split across focused sub-services:
 *
 *   calendar-db.service.ts          – Database/persistence operations
 *   calendar-auth.service.ts        – OAuth flow (connect, token refresh)
 *   calendar-google.service.ts      – Google Calendar API operations
 *   calendar-microsoft.service.ts   – Microsoft Graph API operations
 *   calendar-availability.service.ts – Availability analysis
 */

export { CalendarDbService } from './calendar-db.service';
export { CalendarAuthService, REDIRECT_URI } from './calendar-auth.service';
export { CalendarGoogleService, PLATFORM_CALENDAR_NAME } from './calendar-google.service';
export { CalendarMicrosoftService } from './calendar-microsoft.service';
export { CalendarAvailabilityService } from './calendar-availability.service';

import type { CalendarIntegration, CalendarEvent, CalendarAvailability, TimeBlock } from '../types/user-context.types';
import { CalendarDbService } from './calendar-db.service';
import { CalendarAuthService } from './calendar-auth.service';
import { CalendarGoogleService } from './calendar-google.service';
import { CalendarMicrosoftService } from './calendar-microsoft.service';
import { CalendarAvailabilityService } from './calendar-availability.service';
import {
  getCalendarEventsForUser,
  getCalendarIdForUser as resolveCalendarIdForUser,
} from './calendar-integration-cross-provider.service';

type CalendarProvider = 'google' | 'microsoft';

/**
 * CalendarIntegrationService
 *
 * Unified facade that re-exposes all methods from the sub-services under a
 * single class, preserving backward compatibility for every existing import.
 */
export class CalendarIntegrationService {
  // ─── Auth ─────────────────────────────────────────────────────────────────

  static getGoogleAuthUrl(userId: string): string {
    return CalendarAuthService.getGoogleAuthUrl(userId);
  }

  static getMicrosoftAuthUrl(userId: string): string {
    return CalendarAuthService.getMicrosoftAuthUrl(userId);
  }

  static async connectGoogleCalendar(userId: string, authCode: string, expectedEmail?: string): Promise<CalendarIntegration | null> {
    return CalendarAuthService.connectGoogleCalendar(userId, authCode, expectedEmail);
  }

  static async connectMicrosoftCalendar(userId: string, authCode: string, expectedEmail?: string): Promise<CalendarIntegration | null> {
    return CalendarAuthService.connectMicrosoftCalendar(userId, authCode, expectedEmail);
  }

  static async refreshTokenIfNeeded(userId: string): Promise<string | null> {
    return CalendarAuthService.refreshTokenIfNeeded(userId);
  }

  // ─── Database ─────────────────────────────────────────────────────────────

  static async getCalendarIntegration(userId: string): Promise<CalendarIntegration | null> {
    return CalendarDbService.getCalendarIntegration(userId);
  }

  static async disconnectCalendar(userId: string, provider?: 'google' | 'microsoft'): Promise<boolean> {
    return CalendarDbService.disconnectCalendar(userId, provider);
  }

  static async saveSecondaryCalendarId(userId: string, calendarId: string): Promise<void> {
    return CalendarDbService.saveSecondaryCalendarId(userId, calendarId);
  }

  static async getSecondaryCalendarId(userId: string): Promise<string | null> {
    return CalendarDbService.getSecondaryCalendarId(userId);
  }

  static async getSelectedCalendarIds(
    userId: string,
    provider?: CalendarProvider,
  ): Promise<string[] | null> {
    return CalendarDbService.getSelectedCalendarIds(userId, provider);
  }

  static async saveSelectedCalendarIds(
    userId: string,
    calendarIds: string[],
    provider?: CalendarProvider,
  ): Promise<void> {
    return CalendarDbService.saveSelectedCalendarIds(userId, calendarIds, provider);
  }

  // ─── Google Calendar ──────────────────────────────────────────────────────

  static async getGoogleCalendarList(accessToken: string): Promise<Array<{
    id: string;
    summary: string;
    primary: boolean;
    accessRole: string;
    backgroundColor?: string;
  }>> {
    return CalendarGoogleService.getGoogleCalendarList(accessToken);
  }

  static async getFreeBusyInfo(
    accessToken: string,
    startDate: Date,
    endDate: Date,
    calendarIds?: string[],
    userId?: string
  ): Promise<{
    calendars: Record<string, { busy: Array<{ start: string; end: string }> }>;
    allBusySlots: Array<{ start: Date; end: Date }>;
  }> {
    return CalendarGoogleService.getFreeBusyInfo(accessToken, startDate, endDate, calendarIds, userId);
  }

  static async getGoogleCalendarEvents(
    accessToken: string,
    startDate: Date,
    endDate: Date,
    selectedCalendarIds?: string[]
  ): Promise<CalendarEvent[]> {
    return CalendarGoogleService.getGoogleCalendarEvents(accessToken, startDate, endDate, selectedCalendarIds);
  }

  static async createGoogleEvent(
    accessToken: string,
    event: {
      title: string;
      description?: string;
      startTime: string;
      endTime: string;
      timezone: string;
      location?: string;
    },
    calendarId: string | null
  ): Promise<{ id: string; htmlLink?: string } | null> {
    return CalendarGoogleService.createGoogleEvent(accessToken, event, calendarId);
  }

  static async updateGoogleEvent(
    accessToken: string,
    eventId: string,
    event: {
      title?: string;
      description?: string;
      startTime?: string;
      endTime?: string;
      timezone?: string;
      location?: string;
    },
    calendarId: string | null
  ): Promise<boolean> {
    return CalendarGoogleService.updateGoogleEvent(accessToken, eventId, event, calendarId);
  }

  static async deleteGoogleEvent(
    accessToken: string,
    eventId: string,
    calendarId: string | null
  ): Promise<boolean> {
    return CalendarGoogleService.deleteGoogleEvent(accessToken, eventId, calendarId);
  }

  static async getOrCreatePlatformCalendar(accessToken: string): Promise<string | null> {
    return CalendarGoogleService.getOrCreatePlatformCalendar(accessToken);
  }

  // ─── Microsoft Calendar ───────────────────────────────────────────────────

  static async getMicrosoftCalendarList(accessToken: string): Promise<Array<{
    id: string;
    name: string;
    isDefaultCalendar: boolean;
    canEdit: boolean;
    color?: string;
  }>> {
    return CalendarMicrosoftService.getMicrosoftCalendarList(accessToken);
  }

  static async getMicrosoftCalendarEvents(
    accessToken: string,
    startDate: Date,
    endDate: Date,
    selectedCalendarIds?: string[]
  ): Promise<CalendarEvent[]> {
    return CalendarMicrosoftService.getMicrosoftCalendarEvents(accessToken, startDate, endDate, selectedCalendarIds);
  }

  static async createMicrosoftEvent(
    accessToken: string,
    event: {
      title: string;
      description?: string;
      startTime: string;
      endTime: string;
      timezone: string;
      location?: string;
    }
  ): Promise<{ id: string } | null> {
    return CalendarMicrosoftService.createMicrosoftEvent(accessToken, event);
  }

  static async deleteMicrosoftEvent(
    accessToken: string,
    eventId: string
  ): Promise<boolean> {
    return CalendarMicrosoftService.deleteMicrosoftEvent(accessToken, eventId);
  }

  // ─── Cross-provider helpers ───────────────────────────────────────────────

  /**
   * Obtiene eventos del calendario del usuario (detecta proveedor automáticamente)
   */
  static async getCalendarEvents(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]> {
    return getCalendarEventsForUser(userId, startDate, endDate);
  }

  /**
   * Obtiene el calendario secundario del usuario, creándolo si no existe
   */
  static async getCalendarIdForUser(userId: string): Promise<{
    calendarId: string | null;
    accessToken: string | null;
    provider: 'google' | 'microsoft' | null;
  }> {
    return resolveCalendarIdForUser(userId);
  }

  // ─── Availability ─────────────────────────────────────────────────────────

  static analyzeAvailability(
    events: CalendarEvent[],
    startDate: Date,
    endDate: Date,
    preferredDays: number[] = [1, 2, 3, 4, 5],
    workingHours: { start: number; end: number } = { start: 8, end: 20 }
  ): CalendarAvailability[] {
    return CalendarAvailabilityService.analyzeAvailability(events, startDate, endDate, preferredDays, workingHours);
  }

  static findFreeTimeSlots(
    availability: CalendarAvailability[],
    minDurationMinutes: number
  ): Array<{ date: string; slot: TimeBlock }> {
    return CalendarAvailabilityService.findFreeTimeSlots(availability, minDurationMinutes);
  }
}
