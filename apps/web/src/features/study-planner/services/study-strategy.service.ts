import {
  calculateBalancedBreaks,
  calculateIntensiveBreaks,
  calculatePomodoroBreaks,
  calculateStudyBreaks,
  calculateTotalTimeWithBreaks,
  formatBreaksForDisplay,
  getStudyStrategyConfig,
} from './study-strategy-breaks.service'
import {
  suggestStudyMode,
  validateDailyStudyLoad,
} from './study-strategy-validation.service'
import type {
  BreakConfig,
  DailyStudyValidation,
  SessionBreakdown,
  StudyMode,
} from './study-strategy.types'

export type {
  BreakConfig,
  BreakInterval,
  DailyStudyValidation,
  SessionBreakdown,
  StudyMode,
} from './study-strategy.types'

export class StudyStrategyService {
  static getConfig(mode: StudyMode, customConfig?: Partial<BreakConfig>): BreakConfig {
    return getStudyStrategyConfig(mode, customConfig)
  }

  static calculatePomodoroBreaks(
    sessionMinutes: number,
    config?: Partial<BreakConfig>,
  ): SessionBreakdown {
    return calculatePomodoroBreaks(sessionMinutes, config)
  }

  static calculateBalancedBreaks(
    sessionMinutes: number,
    config?: Partial<BreakConfig>,
  ): SessionBreakdown {
    return calculateBalancedBreaks(sessionMinutes, config)
  }

  static calculateIntensiveBreaks(
    sessionMinutes: number,
    config?: Partial<BreakConfig>,
  ): SessionBreakdown {
    return calculateIntensiveBreaks(sessionMinutes, config)
  }

  static calculateBreaks(
    sessionMinutes: number,
    mode: StudyMode,
    config?: Partial<BreakConfig>,
  ): SessionBreakdown {
    return calculateStudyBreaks(sessionMinutes, mode, config)
  }

  static validateDailyStudyLoad(
    sessions: Array<{ startTime: Date; endTime: Date; durationMinutes: number }>,
    maxConsecutiveHours = 2,
  ): DailyStudyValidation {
    return validateDailyStudyLoad(sessions, maxConsecutiveHours)
  }

  static suggestStudyMode(
    totalMinutesToStudy: number,
    daysAvailable: number,
    hasDeadline = false,
  ): { mode: StudyMode; reason: string } {
    return suggestStudyMode(totalMinutesToStudy, daysAvailable, hasDeadline)
  }

  static formatBreaksForDisplay(breakdown: SessionBreakdown): string[] {
    return formatBreaksForDisplay(breakdown)
  }

  static calculateTotalTimeWithBreaks(
    sessionMinutes: number,
    mode: StudyMode,
    config?: Partial<BreakConfig>,
  ): number {
    return calculateTotalTimeWithBreaks(sessionMinutes, mode, config)
  }
}
