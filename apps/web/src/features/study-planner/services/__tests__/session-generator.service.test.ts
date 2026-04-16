import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SessionGeneratorService } from '../session-generator.service'
import type { GeneratedSession, SessionConfig } from '../session-generator.service'

vi.mock('../lesson-time.service', () => ({
  LessonTimeService: {
    getCourseTimeEstimate: vi.fn(),
  },
}))

vi.mock('../session-validator.service', () => ({
  SessionValidatorService: {
    calculateBreakSchedule: vi.fn().mockReturnValue([]),
  },
  BreakSchedule: {},
}))

import { LessonTimeService } from '../lesson-time.service'
import { SessionValidatorService } from '../session-validator.service'

function makeConfig(overrides: Partial<SessionConfig> = {}): SessionConfig {
  return {
    selectedDays: ['lunes', 'miércoles', 'viernes'],
    timeBlocks: [
      { day: 'lunes', startHour: 9, startMinute: 0, endHour: 11, endMinute: 0 },
      { day: 'miércoles', startHour: 9, startMinute: 0, endHour: 11, endMinute: 0 },
      { day: 'viernes', startHour: 9, startMinute: 0, endHour: 11, endMinute: 0 },
    ],
    minSessionMinutes: 20,
    maxSessionMinutes: 60,
    startDate: new Date('2026-04-06'),
    ...overrides,
  }
}

function makeCourseTimeEstimate(courseId: string, lessonCount: number) {
  return {
    courseId,
    courseTitle: `Course ${courseId}`,
    lessons: Array.from({ length: lessonCount }, (_, i) => ({
      lessonId: `${courseId}-lesson-${i + 1}`,
      lessonTitle: `Lesson ${i + 1}`,
      totalMinutes: 30,
    })),
  }
}

function makeSession(overrides: Partial<GeneratedSession> = {}): GeneratedSession {
  return {
    id: 'session-1',
    date: new Date('2026-04-06'),
    dayOfWeek: 'lunes',
    startTime: '09:00',
    endTime: '09:30',
    durationMinutes: 30,
    netStudyMinutes: 30,
    courseId: 'c1',
    courseTitle: 'Course c1',
    lessonId: 'c1-lesson-1',
    lessonTitle: 'Lesson 1',
    breaks: [],
    order: 1,
    ...overrides,
  }
}

describe('SessionGeneratorService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(SessionValidatorService.calculateBreakSchedule).mockReturnValue([])
  })

  describe('generateSessions', () => {
    it('returns empty sessions with warning when no lessons found', async () => {
      vi.mocked(LessonTimeService.getCourseTimeEstimate).mockResolvedValue(null)

      const result = await SessionGeneratorService.generateSessions(makeConfig(), ['c1'])

      expect(result.sessions).toHaveLength(0)
      expect(result.totalSessions).toBe(0)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0]).toContain('No se encontraron')
    })

    it('generates sessions for each lesson', async () => {
      vi.mocked(LessonTimeService.getCourseTimeEstimate).mockResolvedValue(
        makeCourseTimeEstimate('c1', 3),
      )

      const result = await SessionGeneratorService.generateSessions(makeConfig(), ['c1'])

      expect(result.totalSessions).toBe(3)
      expect(result.sessions).toHaveLength(3)
    })

    it('distributes sessions across selected days only', async () => {
      vi.mocked(LessonTimeService.getCourseTimeEstimate).mockResolvedValue(
        makeCourseTimeEstimate('c1', 3),
      )

      const result = await SessionGeneratorService.generateSessions(makeConfig(), ['c1'])

      const days = result.sessions.map((s) => s.dayOfWeek)
      for (const day of days) {
        expect(['lunes', 'miércoles', 'viernes']).toContain(day)
      }
    })

    it('adds warning when end date is reached with remaining lessons', async () => {
      vi.mocked(LessonTimeService.getCourseTimeEstimate).mockResolvedValue(
        makeCourseTimeEstimate('c1', 100),
      )

      const config = makeConfig({ endDate: new Date('2026-04-10') })
      const result = await SessionGeneratorService.generateSessions(config, ['c1'])

      expect(result.warnings.some((w) => w.includes('pendientes'))).toBe(true)
      expect(result.totalSessions).toBeLessThan(100)
    })

    it('assigns incrementing order to sessions', async () => {
      vi.mocked(LessonTimeService.getCourseTimeEstimate).mockResolvedValue(
        makeCourseTimeEstimate('c1', 3),
      )

      const result = await SessionGeneratorService.generateSessions(makeConfig(), ['c1'])

      expect(result.sessions.map((s) => s.order)).toEqual([1, 2, 3])
    })

    it('calculates total study and break minutes', async () => {
      vi.mocked(LessonTimeService.getCourseTimeEstimate).mockResolvedValue(
        makeCourseTimeEstimate('c1', 2),
      )
      vi.mocked(SessionValidatorService.calculateBreakSchedule).mockReturnValue([
        { afterMinutes: 25, breakDurationMinutes: 5 },
      ])

      const result = await SessionGeneratorService.generateSessions(makeConfig(), ['c1'])

      expect(result.totalStudyMinutes).toBeGreaterThan(0)
      expect(result.totalBreakMinutes).toBe(10) // 5 min break x 2 sessions
    })

    it('respects min/max session duration', async () => {
      vi.mocked(LessonTimeService.getCourseTimeEstimate).mockResolvedValue({
        courseId: 'c1',
        courseTitle: 'Course c1',
        lessons: [
          { lessonId: 'l1', lessonTitle: 'Short', totalMinutes: 5 },
          { lessonId: 'l2', lessonTitle: 'Long', totalMinutes: 120 },
        ],
      })

      const config = makeConfig({ minSessionMinutes: 20, maxSessionMinutes: 60 })
      const result = await SessionGeneratorService.generateSessions(config, ['c1'])

      for (const session of result.sessions) {
        expect(session.netStudyMinutes).toBeGreaterThanOrEqual(20)
        expect(session.netStudyMinutes).toBeLessThanOrEqual(60)
      }
    })

    it('sets estimatedEndDate to last session date', async () => {
      vi.mocked(LessonTimeService.getCourseTimeEstimate).mockResolvedValue(
        makeCourseTimeEstimate('c1', 2),
      )

      const result = await SessionGeneratorService.generateSessions(makeConfig(), ['c1'])

      expect(result.estimatedEndDate).toEqual(
        result.sessions[result.sessions.length - 1].date,
      )
    })

    it('handles multiple courses', async () => {
      vi.mocked(LessonTimeService.getCourseTimeEstimate)
        .mockResolvedValueOnce(makeCourseTimeEstimate('c1', 2))
        .mockResolvedValueOnce(makeCourseTimeEstimate('c2', 1))

      const result = await SessionGeneratorService.generateSessions(makeConfig(), ['c1', 'c2'])

      expect(result.totalSessions).toBe(3)
      const courseIds = new Set(result.sessions.map((s) => s.courseId))
      expect(courseIds.has('c1')).toBe(true)
      expect(courseIds.has('c2')).toBe(true)
    })
  })

  describe('groupSessionsByWeek', () => {
    it('groups sessions into weeks starting Monday', () => {
      const sessions = [
        makeSession({ date: new Date('2026-04-06') }), // Monday
        makeSession({ date: new Date('2026-04-08') }), // Wednesday
        makeSession({ date: new Date('2026-04-13') }), // Next Monday
      ]

      const weeks = SessionGeneratorService.groupSessionsByWeek(sessions)

      expect(weeks.size).toBe(2)
    })

    it('returns empty map for empty input', () => {
      const weeks = SessionGeneratorService.groupSessionsByWeek([])
      expect(weeks.size).toBe(0)
    })
  })

  describe('calculateSessionStats', () => {
    it('returns zeros for empty sessions', () => {
      const stats = SessionGeneratorService.calculateSessionStats([])

      expect(stats.avgSessionMinutes).toBe(0)
      expect(stats.avgBreakMinutes).toBe(0)
      expect(stats.sessionsPerWeek).toBe(0)
      expect(stats.studyHoursPerWeek).toBe(0)
    })

    it('calculates average session and break minutes', () => {
      const sessions = [
        makeSession({ netStudyMinutes: 30, breaks: [{ afterMinutes: 25, breakDurationMinutes: 5 }] }),
        makeSession({ netStudyMinutes: 40, breaks: [{ afterMinutes: 25, breakDurationMinutes: 10 }] }),
      ]

      const stats = SessionGeneratorService.calculateSessionStats(sessions)

      expect(stats.avgSessionMinutes).toBe(35)
      expect(stats.avgBreakMinutes).toBe(8) // (5+10)/2 rounded
    })

    it('calculates sessions per week', () => {
      const sessions = [
        makeSession({ date: new Date('2026-04-06'), netStudyMinutes: 30 }),
        makeSession({ date: new Date('2026-04-08'), netStudyMinutes: 30 }),
        makeSession({ date: new Date('2026-04-13'), netStudyMinutes: 30 }),
      ]

      const stats = SessionGeneratorService.calculateSessionStats(sessions)

      expect(stats.sessionsPerWeek).toBeGreaterThanOrEqual(1)
    })

    it('calculates study hours per week', () => {
      const sessions = [
        makeSession({ date: new Date('2026-04-06'), netStudyMinutes: 60 }),
        makeSession({ date: new Date('2026-04-08'), netStudyMinutes: 60 }),
      ]

      const stats = SessionGeneratorService.calculateSessionStats(sessions)

      expect(stats.studyHoursPerWeek).toBeGreaterThan(0)
    })
  })
})
