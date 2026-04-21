import type { GeneratedSession } from './session-generator.types';

export function groupSessionsByWeek(sessions: GeneratedSession[]): Map<string, GeneratedSession[]> {
  const weeks = new Map<string, GeneratedSession[]>();

  for (const session of sessions) {
    const weekStart = getWeekStart(session.date);
    const weekKey = weekStart.toISOString().split('T')[0];

    if (!weeks.has(weekKey)) {
      weeks.set(weekKey, []);
    }
    weeks.get(weekKey)!.push(session);
  }

  return weeks;
}

export function calculateSessionStats(sessions: GeneratedSession[]): {
  avgSessionMinutes: number;
  avgBreakMinutes: number;
  sessionsPerWeek: number;
  studyHoursPerWeek: number;
} {
  if (sessions.length === 0) {
    return {
      avgSessionMinutes: 0,
      avgBreakMinutes: 0,
      sessionsPerWeek: 0,
      studyHoursPerWeek: 0,
    };
  }

  const totalStudy = sessions.reduce((sum, session) => sum + session.netStudyMinutes, 0);
  const totalBreaks = sessions.reduce(
    (sum, session) => sum + session.breaks.reduce(
      (breakSum, breakItem) => breakSum + breakItem.breakDurationMinutes,
      0,
    ),
    0,
  );
  const weeks = groupSessionsByWeek(sessions);
  const weekCount = weeks.size || 1;

  return {
    avgSessionMinutes: Math.round(totalStudy / sessions.length),
    avgBreakMinutes: Math.round(totalBreaks / sessions.length),
    sessionsPerWeek: Math.round(sessions.length / weekCount),
    studyHoursPerWeek: Math.round((totalStudy / weekCount) / 60 * 10) / 10,
  };
}

function getWeekStart(date: Date): Date {
  const weekStart = new Date(date);
  const day = weekStart.getDay();
  const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
  weekStart.setDate(diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}
