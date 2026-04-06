/**
 * OrganizationPlannerConfigService
 *
 * Server-side service that reads the B2B planner configuration for an
 * organization: work hours, work days, holidays, and planning windows.
 *
 * Responsibilities:
 *  1. getOrganizationPlannerConfig — fetch or return defaults
 *  2. getOrganizationHolidays       — holidays within a date range
 *  3. isDateWithinPlanningWindow    — validate a date against a window
 *  4. getEffectiveWorkSchedule      — merged config (org + fallback)
 */

import { createClient } from '../../../lib/supabase/server';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OrganizationPlannerConfig {
  workStartTime: string;          // "09:00"
  workEndTime: string;            // "18:00"
  workDays: number[];             // [1,2,3,4,5]
  maxLessonsPerDay: number;
  maxSessionMinutes: number;
  timezone: string;
  defaultCourseStartOffsetDays: number;
  defaultCourseDurationDays: number;
}

export interface OrganizationHoliday {
  id: string;
  date: string;                   // ISO date string "2026-05-01"
  name: string;
  type: 'official' | 'internal';
  isRecurring: boolean;
}

export interface PlanningWindow {
  startDate: Date;
  endDate: Date;
  dueDate?: Date;
}

// ---------------------------------------------------------------------------
// Defaults (applied when org has no custom config)
// ---------------------------------------------------------------------------

const DEFAULT_PLANNER_CONFIG: OrganizationPlannerConfig = {
  workStartTime: '09:00',
  workEndTime: '18:00',
  workDays: [1, 2, 3, 4, 5],
  maxLessonsPerDay: 2,
  maxSessionMinutes: 60,
  timezone: 'America/Mexico_City',
  defaultCourseStartOffsetDays: 0,
  defaultCourseDurationDays: 30,
};

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class OrganizationPlannerConfigService {
  /**
   * Fetches the planner config for an organization.
   * Returns default values if no custom config exists.
   */
  static async getOrganizationPlannerConfig(
    organizationId: string,
  ): Promise<OrganizationPlannerConfig> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('organization_planner_config')
      .select(
        'work_start_time, work_end_time, work_days, max_lessons_per_day, max_session_minutes, timezone, default_course_start_offset_days, default_course_duration_days',
      )
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (error) {
      console.error(
        `[OrganizationPlannerConfigService] Error fetching config for org ${organizationId}:`,
        error,
      );
      return { ...DEFAULT_PLANNER_CONFIG };
    }

    if (!data) {
      return { ...DEFAULT_PLANNER_CONFIG };
    }

    return {
      workStartTime: data.work_start_time ?? DEFAULT_PLANNER_CONFIG.workStartTime,
      workEndTime: data.work_end_time ?? DEFAULT_PLANNER_CONFIG.workEndTime,
      workDays: data.work_days ?? DEFAULT_PLANNER_CONFIG.workDays,
      maxLessonsPerDay: data.max_lessons_per_day ?? DEFAULT_PLANNER_CONFIG.maxLessonsPerDay,
      maxSessionMinutes: data.max_session_minutes ?? DEFAULT_PLANNER_CONFIG.maxSessionMinutes,
      timezone: data.timezone ?? DEFAULT_PLANNER_CONFIG.timezone,
      defaultCourseStartOffsetDays:
        data.default_course_start_offset_days ?? DEFAULT_PLANNER_CONFIG.defaultCourseStartOffsetDays,
      defaultCourseDurationDays:
        data.default_course_duration_days ?? DEFAULT_PLANNER_CONFIG.defaultCourseDurationDays,
    };
  }

  /**
   * Returns the holidays for an organization within a given date range.
   * Includes both official and internal holidays.
   * For recurring holidays, matches by month/day regardless of year.
   */
  static async getOrganizationHolidays(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<OrganizationHoliday[]> {
    const supabase = await createClient();

    const isoStart = startDate.toISOString().split('T')[0];
    const isoEnd = endDate.toISOString().split('T')[0];

    // Fetch non-recurring holidays within the date range
    const { data: fixedHolidays, error: fixedError } = await supabase
      .from('organization_holidays')
      .select('id, holiday_date, name, type, is_recurring')
      .eq('organization_id', organizationId)
      .eq('is_recurring', false)
      .gte('holiday_date', isoStart)
      .lte('holiday_date', isoEnd);

    if (fixedError) {
      console.error(
        `[OrganizationPlannerConfigService] Error fetching fixed holidays:`,
        fixedError,
      );
    }

    // Fetch all recurring holidays (we'll filter by month/day in memory)
    const { data: recurringHolidays, error: recurError } = await supabase
      .from('organization_holidays')
      .select('id, holiday_date, name, type, is_recurring')
      .eq('organization_id', organizationId)
      .eq('is_recurring', true);

    if (recurError) {
      console.error(
        `[OrganizationPlannerConfigService] Error fetching recurring holidays:`,
        recurError,
      );
    }

    const results: OrganizationHoliday[] = [];

    // Add fixed holidays
    for (const h of fixedHolidays ?? []) {
      results.push({
        id: h.id,
        date: h.holiday_date,
        name: h.name,
        type: h.type as 'official' | 'internal',
        isRecurring: false,
      });
    }

    // Add recurring holidays that fall within the range
    for (const h of recurringHolidays ?? []) {
      const holidayDate = new Date(h.holiday_date);
      const month = holidayDate.getMonth();
      const day = holidayDate.getDate();

      // Check if this month/day falls within start..end for each year in range
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();

      for (let year = startYear; year <= endYear; year++) {
        const candidate = new Date(year, month, day);
        if (candidate >= startDate && candidate <= endDate) {
          results.push({
            id: h.id,
            date: candidate.toISOString().split('T')[0],
            name: h.name,
            type: h.type as 'official' | 'internal',
            isRecurring: true,
          });
        }
      }
    }

    return results.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }

  /**
   * Checks whether a given date falls within a planning window.
   */
  static isDateWithinPlanningWindow(
    date: Date,
    window: PlanningWindow,
  ): boolean {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const windowStart = new Date(window.startDate);
    windowStart.setHours(0, 0, 0, 0);

    const windowEnd = new Date(window.endDate);
    windowEnd.setHours(23, 59, 59, 999);

    return dayStart >= windowStart && dayStart <= windowEnd;
  }

  /**
   * Returns the effective work schedule for a given organization.
   * If no config exists, returns sensible defaults.
   */
  static async getEffectiveWorkSchedule(
    organizationId: string | null,
  ): Promise<OrganizationPlannerConfig> {
    if (!organizationId) {
      return { ...DEFAULT_PLANNER_CONFIG };
    }

    return this.getOrganizationPlannerConfig(organizationId);
  }
}
