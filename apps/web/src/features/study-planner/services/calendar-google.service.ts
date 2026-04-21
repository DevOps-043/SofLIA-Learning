/**
 * CalendarGoogleService
 *
 * Thin facade over split Google Calendar service modules.
 * Detailed implementations live in:
 *   - calendar-google-read.service.ts    (list, freeBusy, events read)
 *   - calendar-google-write.service.ts   (create, update, delete)
 *   - calendar-google-platform.service.ts (platform secondary calendar)
 */

import type { GoogleUserInfoResponse } from './calendar-google.types';
import {
  getFreeBusyInfo,
  getGoogleCalendarEvents,
  getGoogleCalendarList,
} from './calendar-google-read.service';
import {
  createGoogleEvent,
  deleteGoogleEvent,
  updateGoogleEvent,
} from './calendar-google-write.service';
import {
  createPlatformCalendar,
  findPlatformCalendar,
  getOrCreatePlatformCalendar,
  PLATFORM_CALENDAR_NAME,
} from './calendar-google-platform.service';

export { PLATFORM_CALENDAR_NAME };

export class CalendarGoogleService {
  static getGoogleCalendarList = getGoogleCalendarList;
  static getFreeBusyInfo = getFreeBusyInfo;
  static getGoogleCalendarEvents = getGoogleCalendarEvents;
  static createGoogleEvent = createGoogleEvent;
  static updateGoogleEvent = updateGoogleEvent;
  static deleteGoogleEvent = deleteGoogleEvent;
  static findPlatformCalendar = findPlatformCalendar;
  static createPlatformCalendar = createPlatformCalendar;
  static getOrCreatePlatformCalendar = getOrCreatePlatformCalendar;

  static async getGoogleUserEmail(accessToken: string): Promise<string | null> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        console.error('Error obteniendo info de usuario de Google:', await response.text());
        return null;
      }
      const data: GoogleUserInfoResponse = await response.json();
      return data.email || null;
    } catch (error) {
      console.error('Error obteniendo email de Google:', error);
      return null;
    }
  }
}
