import { describe, it, expect } from 'vitest';
import { LiaPromptFormatterService } from '../lia-prompt-formatter.service';
import type { StudyPlannerContext } from '../lia-context.types';

const makeMinimalContext = (overrides: Partial<StudyPlannerContext> = {}): StudyPlannerContext =>
  ({
    userType: 'b2c',
    userProfile: {
      nombre: 'Alice',
      rol: 'Developer',
      area: 'Engineering',
      nivel: 'Senior',
      sector: 'Tech',
    },
    courses: [],
    calendarConnected: false,
    ...overrides,
  } as StudyPlannerContext);

// ─── formatContextForPrompt ───────────────────────────────────────────────────

describe('LiaPromptFormatterService.formatContextForPrompt', () => {
  it('returns non-empty string', () => {
    const result = LiaPromptFormatterService.formatContextForPrompt(makeMinimalContext());
    expect(result.length).toBeGreaterThan(0);
  });

  it('includes TIPO DE USUARIO section', () => {
    const result = LiaPromptFormatterService.formatContextForPrompt(makeMinimalContext());
    expect(result).toContain('TIPO DE USUARIO');
  });

  it('identifies b2c user correctly', () => {
    const result = LiaPromptFormatterService.formatContextForPrompt(
      makeMinimalContext({ userType: 'b2c' })
    );
    expect(result).toContain('B2C');
  });

  it('identifies b2b user with courses correctly', () => {
    const ctx = makeMinimalContext({
      userType: 'b2b',
      courses: [{ id: 'c1', title: 'Course 1' } as any],
    });
    const result = LiaPromptFormatterService.formatContextForPrompt(ctx);
    expect(result).toContain('B2B');
    expect(result).toContain('cursos asignados');
  });

  it('identifies b2b user without courses correctly', () => {
    const ctx = makeMinimalContext({ userType: 'b2b', courses: [] });
    const result = LiaPromptFormatterService.formatContextForPrompt(ctx);
    expect(result).toContain('B2B');
    expect(result).toContain('no tiene cursos asignados');
  });

  it('includes user profile section', () => {
    const result = LiaPromptFormatterService.formatContextForPrompt(makeMinimalContext());
    expect(result).toContain('PERFIL PROFESIONAL');
    expect(result).toContain('Developer');
    expect(result).toContain('Engineering');
  });

  it('includes user name when provided', () => {
    const result = LiaPromptFormatterService.formatContextForPrompt(makeMinimalContext());
    expect(result).toContain('Alice');
  });

  it('does not include name section when nombre is not set', () => {
    const ctx = makeMinimalContext();
    ctx.userProfile.nombre = undefined as any;
    const result = LiaPromptFormatterService.formatContextForPrompt(ctx);
    expect(result).not.toContain('- Nombre:');
  });

  it('includes organization section for b2b with org', () => {
    const ctx = makeMinimalContext({
      userType: 'b2b',
      courses: [],
      organization: { name: 'Acme Corp', industry: 'Tech', size: '100-500' } as any,
    });
    const result = LiaPromptFormatterService.formatContextForPrompt(ctx);
    expect(result).toContain('ORGANIZACIÓN');
    expect(result).toContain('Acme Corp');
  });

  it('includes CURSOS section with count', () => {
    const ctx = makeMinimalContext({
      courses: [
        {
          id: 'c1',
          title: 'AI Fundamentals',
          category: 'AI',
          level: 'beginner',
          durationMinutes: 120,
          completionPercentage: 0,
          modules: [],
        } as any,
      ],
    });
    const result = LiaPromptFormatterService.formatContextForPrompt(ctx);
    expect(result).toContain('CURSOS');
    expect(result).toContain('AI Fundamentals');
  });

  it('shows due date for course with dueDate', () => {
    const futureDate = new Date('2026-12-31').toISOString();
    const ctx = makeMinimalContext({
      courses: [
        {
          id: 'c1',
          title: 'Course',
          category: 'X',
          level: 'beginner',
          durationMinutes: 60,
          completionPercentage: 0,
          dueDate: futureDate,
          modules: [],
        } as any,
      ],
    });
    const result = LiaPromptFormatterService.formatContextForPrompt(ctx);
    expect(result).toContain('Fecha límite');
  });

  it('shows pending lessons section when course has pending lessons', () => {
    const ctx = makeMinimalContext({
      courses: [
        {
          id: 'c1',
          title: 'AI',
          category: 'AI',
          level: 'beginner',
          durationMinutes: 60,
          completionPercentage: 0,
          modules: [
            {
              moduleOrderIndex: 1,
              moduleTitle: 'Intro',
              lessons: [
                { lessonOrderIndex: 1, lessonTitle: 'Lesson 1', durationMinutes: 20, isCompleted: false },
              ],
            },
          ],
        } as any,
      ],
    });
    const result = LiaPromptFormatterService.formatContextForPrompt(ctx);
    expect(result).toContain('LECCIONES PENDIENTES');
    expect(result).toContain('Lesson 1');
  });

  it('does not show pending lessons for fully completed course', () => {
    const ctx = makeMinimalContext({
      courses: [
        {
          id: 'c1',
          title: 'Done',
          category: 'X',
          level: 'beginner',
          durationMinutes: 30,
          completionPercentage: 100,
          modules: [
            {
              moduleOrderIndex: 1,
              moduleTitle: 'M1',
              lessons: [
                { lessonOrderIndex: 1, lessonTitle: 'Done Lesson', durationMinutes: 30, isCompleted: true },
              ],
            },
          ],
        } as any,
      ],
    });
    const result = LiaPromptFormatterService.formatContextForPrompt(ctx);
    expect(result).not.toContain('LECCIONES PENDIENTES');
  });

  it('includes CALENDARIO section', () => {
    const result = LiaPromptFormatterService.formatContextForPrompt(makeMinimalContext());
    expect(result).toContain('CALENDARIO');
  });

  it('shows calendar not connected message when not connected', () => {
    const result = LiaPromptFormatterService.formatContextForPrompt(
      makeMinimalContext({ calendarConnected: false })
    );
    expect(result).toContain('no conectado');
  });

  it('shows connected calendar when connected', () => {
    const ctx = makeMinimalContext({
      calendarConnected: true,
      calendarProvider: 'google' as any,
    });
    const result = LiaPromptFormatterService.formatContextForPrompt(ctx);
    expect(result).toContain('Google Calendar');
  });

  it('includes upcoming deadlines for b2b context', () => {
    const ctx = makeMinimalContext({
      userType: 'b2b',
      courses: [],
      upcomingDeadlines: [
        { courseTitle: 'Urgent Course', daysRemaining: 3, completionPercentage: 50 } as any,
      ],
    });
    const result = LiaPromptFormatterService.formatContextForPrompt(ctx);
    expect(result).toContain('PLAZOS PRÓXIMOS');
    expect(result).toContain('Urgent Course');
    expect(result).toContain('URGENTE');
  });

  it('includes existing preferences section when preferences exist', () => {
    const ctx = makeMinimalContext({
      existingPreferences: {
        timezone: 'America/Mexico_City',
        preferredTimeOfDay: 'morning',
        preferredDays: [1, 2, 3],
        weeklyTargetMinutes: 120,
      } as any,
    });
    const result = LiaPromptFormatterService.formatContextForPrompt(ctx);
    expect(result).toContain('PREFERENCIAS GUARDADAS');
    expect(result).toContain('America/Mexico_City');
  });
});

// ─── formatPreCalculatedSessionsForPrompt ────────────────────────────────────

describe('LiaPromptFormatterService.formatPreCalculatedSessionsForPrompt', () => {
  const makeSession = (weekNumber: number, dayName: string, date: string) => ({
    weekNumber,
    dayName,
    date,
    timeSlot: 'mañana',
    startTime: '08:00',
    endTime: '09:00',
    totalMinutes: 60,
    lessons: [{ title: 'Lesson A', duration: 60 }],
  });

  it('returns empty string when no sessions', () => {
    const result = LiaPromptFormatterService.formatPreCalculatedSessionsForPrompt({
      sessions: [],
      summary: { totalWeeks: 0, totalSessions: 0, totalLessons: 0, finishDate: '' },
    });
    expect(result).toBe('');
  });

  it('includes PRE-CALCULADO header', () => {
    const result = LiaPromptFormatterService.formatPreCalculatedSessionsForPrompt({
      sessions: [makeSession(1, 'Lunes', '16 de junio')],
      summary: { totalWeeks: 1, totalSessions: 1, totalLessons: 1, finishDate: '16 de junio' },
    });
    expect(result).toContain('PRE-CALCULADO');
  });

  it('includes session start and end times', () => {
    const result = LiaPromptFormatterService.formatPreCalculatedSessionsForPrompt({
      sessions: [makeSession(1, 'Lunes', '16 de junio')],
      summary: { totalWeeks: 1, totalSessions: 1, totalLessons: 1, finishDate: '16 de junio' },
    });
    expect(result).toContain('08:00');
    expect(result).toContain('09:00');
  });

  it('includes lesson titles', () => {
    const result = LiaPromptFormatterService.formatPreCalculatedSessionsForPrompt({
      sessions: [makeSession(1, 'Lunes', '16 de junio')],
      summary: { totalWeeks: 1, totalSessions: 1, totalLessons: 1, finishDate: '16 de junio' },
    });
    expect(result).toContain('Lesson A');
  });

  it('includes summary with totalLessons and finishDate', () => {
    const result = LiaPromptFormatterService.formatPreCalculatedSessionsForPrompt({
      sessions: [makeSession(1, 'Lunes', '16 de junio')],
      summary: { totalWeeks: 1, totalSessions: 1, totalLessons: 5, finishDate: '30 de junio' },
    });
    expect(result).toContain('5');
    expect(result).toContain('30 de junio');
  });

  it('groups sessions by week number', () => {
    const sessions = [
      makeSession(1, 'Lunes', '16 de junio'),
      makeSession(2, 'Lunes', '23 de junio'),
    ];
    const result = LiaPromptFormatterService.formatPreCalculatedSessionsForPrompt({
      sessions,
      summary: { totalWeeks: 2, totalSessions: 2, totalLessons: 2, finishDate: '23 de junio' },
    });
    expect(result).toContain('Semana 1');
    expect(result).toContain('Semana 2');
  });

  it('mentions day name in output', () => {
    const result = LiaPromptFormatterService.formatPreCalculatedSessionsForPrompt({
      sessions: [makeSession(1, 'Miércoles', '18 de junio')],
      summary: { totalWeeks: 1, totalSessions: 1, totalLessons: 1, finishDate: '18 de junio' },
    });
    expect(result).toContain('Miércoles');
  });
});
