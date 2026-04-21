export type PreCalculatedSessionsResult = {
  sessions: Array<{
    weekNumber: number;
    dayName: string;
    date: string;
    timeSlot: string;
    startTime: string;
    endTime: string;
    totalMinutes: number;
    lessons: Array<{ title: string; duration: number }>;
  }>;
  summary: {
    totalWeeks: number;
    totalSessions: number;
    totalLessons: number;
    finishDate: string;
  };
};
