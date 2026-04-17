import type { CalendarProvider, UserType } from './user-context.types';

export type StudyApproach = 'corto' | 'balance' | 'largo';

export interface StudyPlannerCourseOption {
  /** Unique key per assignment (may include orgName suffix for deduplication). */
  id: string;
  /** The actual course UUID used for planning and DB operations. */
  courseId: string;
  title: string;
  category: string;
  progress: number;
  organizationId?: string;
  organizationName?: string;
}

export interface StudyPlannerUserContextSummary {
  userType: UserType | null;
}

export type StudyPlannerCalendarProvider = CalendarProvider | null;

export interface StudyPlannerWorkTeamSummary {
  name: string;
  role: string;
}

export interface StudyPlannerUserContext {
  userType: UserType | null;
  userName: string | null;
  rol: string | null;
  area: string | null;
  nivel: string | null;
  tamanoEmpresa: string | null;
  organizationName: string | null;
  minEmpleados: number | null;
  maxEmpleados: number | null;
  workTeams: StudyPlannerWorkTeamSummary[] | null;
}

export interface StudyPlannerAssignedCourse {
  courseId: string;
  id?: string;
  title: string;
  dueDate: string | null;
  planningWindowStart?: string | null;
  planningWindowEnd?: string | null;
  hasActivePlan?: boolean;
  organizationId?: string | null;
  organizationName?: string | null;
  progress?: number;
}

export interface StudyPlannerPendingLesson {
  courseId: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
  moduleTitle: string;
  moduleOrderIndex: number;
  lessonOrderIndex: number;
  durationMinutes: number;
}

export interface StudyPlannerMessage {
  role: string;
  content: string;
}
