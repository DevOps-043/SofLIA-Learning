import type { StudyMode } from './study-strategy.service';
import type { BreakSchedule } from './session-validator.service';
import type { LearningRoute } from './learning-route.service';
import type { B2BAssignment } from './user-context.service';

export interface StudyPlanConfig {
  userId: string;
  userType: 'b2b' | 'b2c';
  organizationId?: string | null;
  name: string;
  description?: string;
  selectedCourseIds: string[];
  learningRoute: LearningRoute;
  minSessionMinutes: number;
  maxSessionMinutes: number;
  preferredSessionType: 'short' | 'medium' | 'long';
  selectedDays: string[];
  timeBlocks: TimeBlock[];
  breakSchedule: BreakSchedule[];
  startDate: Date;
  targetEndDate?: Date;
  assignments?: B2BAssignment[];
  studyMode?: StudyMode;
  maxConsecutiveHours?: number;
  enableSpacedRepetition?: boolean;
}

export interface TimeBlock {
  day: string;
  startHour: number;
  endHour: number;
  startMinute?: number;
  endMinute?: number;
}

export interface SessionBreak {
  afterMinutes: number;
  durationMinutes: number;
}

export interface PlannedSession {
  id: string;
  date: Date;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  courseId: string;
  courseTitle: string;
  lessonId?: string;
  lessonTitle?: string;
  breaks: SessionBreak[];
  status: 'planned';
  pomodoroCount?: number;
  hasIntegratedBreaks?: boolean;
  integratedBreakMinutes?: number;
  studyMode?: StudyMode;
}

export interface PlanSummary {
  totalSessions: number;
  totalStudyMinutes: number;
  totalBreakMinutes: number;
  sessionsPerWeek: number;
  estimatedWeeksToComplete: number;
  estimatedEndDate: Date;
  coursesIncluded: number;
  lessonsPerCourse: Record<string, number>;
}

export interface B2BValidationResult {
  canMeetAllDeadlines: boolean;
  deadlineStatus: Array<{
    courseId: string;
    courseTitle: string;
    deadline: Date;
    canMeet: boolean;
    estimatedCompletion: Date;
    daysMargin: number;
  }>;
}

export interface GeneratedPlan {
  config: StudyPlanConfig;
  sessions: PlannedSession[];
  summary: PlanSummary;
  warnings: string[];
  b2bValidation?: B2BValidationResult;
}
