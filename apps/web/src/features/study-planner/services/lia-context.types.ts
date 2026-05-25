/**
 * lia-context.types.ts
 *
 * Shared types for the SofLIA Study Planner context services.
 */

import type { CalendarEvent } from '../types/user-context.types';
import type {
  StudyPlannerCourseAnalysis,
  StudyPlannerCourseContext,
} from './lia-context-course.types';

export type {
  StudyPlannerCourseAnalysis,
  StudyPlannerCourseContext,
  StudyPlannerLessonContext,
  StudyPlannerModuleContext,
} from './lia-context-course.types';

/**
 * Contexto completo para SofLIA del planificador
 */
export interface StudyPlannerContext {
  // Información del usuario
  userType: 'b2b' | 'b2c';
  userProfile: {
    nombre?: string;
    rol?: string;
    area?: string;
    nivel?: string;
    sector?: string;
    tamanoEmpresa?: string;
    minEmpleados?: number;
    maxEmpleados?: number;
  };

  // Organización (solo B2B)
  organization?: {
    name: string;
    size?: string;
    industry?: string;
  };

  // Equipos de trabajo (solo B2B)
  workTeams?: Array<{
    name: string;
    role: string;
  }>;

  // Cursos
  courses: StudyPlannerCourseContext[];

  // Análisis de cursos
  courseAnalysis?: StudyPlannerCourseAnalysis;

  // Calendario
  calendarConnected: boolean;
  calendarProvider?: 'google' | 'microsoft';
  calendarEvents?: CalendarEvent[];
  calendarAvailability?: {
    totalFreeMinutes: number;
    totalBusyMinutes: number;
    averageFreeMinutesPerDay: number;
    freeSlotCount: number;
  };

  // Preferencias existentes
  existingPreferences?: {
    timezone?: string;
    preferredTimeOfDay?: string;
    preferredDays?: number[];
    weeklyTargetMinutes?: number;
  };

  // Plazos críticos (solo B2B)
  upcomingDeadlines?: Array<{
    courseTitle: string;
    dueDate: string;
    daysRemaining: number;
    completionPercentage: number;
  }>;

  // Fase actual del flujo
  currentPhase?: number;
  phaseData?: Record<string, unknown>;
}
