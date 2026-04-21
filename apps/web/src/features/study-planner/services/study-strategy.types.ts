export type StudyMode = 'pomodoro' | 'balanced' | 'intensive'

export interface BreakConfig {
  shortBreakMinutes: number
  longBreakMinutes: number
  pomodorosBeforeLongBreak: number
  maxStudyBlockMinutes: number
}

export interface BreakInterval {
  afterMinutes: number
  durationMinutes: number
  type: 'short' | 'long' | 'micro'
  label?: string
}

export interface SessionBreakdown {
  studyMinutes: number
  breakMinutes: number
  totalMinutes: number
  breaks: BreakInterval[]
  pomodoroCount?: number
}

export interface DailyStudyValidation {
  isValid: boolean
  totalStudyMinutes: number
  consecutiveBlocks: number
  warnings: string[]
  suggestions: string[]
}

export const DEFAULT_STUDY_STRATEGY_CONFIGS: Record<StudyMode, BreakConfig> = {
  pomodoro: {
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    pomodorosBeforeLongBreak: 4,
    maxStudyBlockMinutes: 25,
  },
  balanced: {
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    pomodorosBeforeLongBreak: 4,
    maxStudyBlockMinutes: 45,
  },
  intensive: {
    shortBreakMinutes: 3,
    longBreakMinutes: 10,
    pomodorosBeforeLongBreak: 6,
    maxStudyBlockMinutes: 60,
  },
}
