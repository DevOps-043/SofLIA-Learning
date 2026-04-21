import type { BreakSchedule } from './session-validator.service';

export interface SessionConfig {
  selectedDays: string[];
  timeBlocks: TimeBlockConfig[];
  minSessionMinutes: number;
  maxSessionMinutes: number;
  startDate: Date;
  endDate?: Date;
}

export interface TimeBlockConfig {
  day: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

export interface GeneratedSession {
  id: string;
  date: Date;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  netStudyMinutes: number;
  courseId: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
  breaks: BreakSchedule[];
  order: number;
}

export interface SessionGenerationResult {
  sessions: GeneratedSession[];
  totalSessions: number;
  totalStudyMinutes: number;
  totalBreakMinutes: number;
  estimatedEndDate: Date;
  warnings: string[];
}

export interface CourseLesson {
  courseId: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
  durationMinutes: number;
}
