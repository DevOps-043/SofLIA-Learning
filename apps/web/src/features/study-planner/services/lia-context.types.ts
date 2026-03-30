/**
 * lia-context.types.ts
 *
 * Shared types for the SofLIA Study Planner context services.
 */

import type { CalendarEvent } from '../types/user-context.types';

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
  courses: Array<{
    id: string;
    title: string;
    category: string;
    level: string;
    durationMinutes: number;
    completionPercentage: number;
    dueDate?: string; // Solo B2B
    assignedBy?: string; // Solo B2B
    modules?: Array<{
      moduleId: string;
      moduleTitle: string;
      moduleOrderIndex: number;
      lessons: Array<{
        lessonId: string;
        lessonTitle: string;
        lessonOrderIndex: number;
        durationMinutes: number;
        isCompleted: boolean;
      }>;
    }>;
  }>;

  // Análisis de cursos
  courseAnalysis?: {
    totalMinutes: number;
    totalLessons: number;
    averageComplexity: number;
    minimumLessonTime: number;
    // ✅ NUEVO: Análisis detallado para recomendaciones de sesión
    averageLessonDuration: number; // Promedio de duración de lecciones en minutos
    maxLessonDuration: number; // Duración máxima de una lección
    minLessonDuration: number; // Duración mínima de una lección
    courseType: 'practical' | 'theoretical' | 'mixed'; // Tipo de curso según análisis
    suggestedSessionDurations: {
      short: number; // Sesión corta sugerida
      normal: number; // Sesión normal sugerida
      long: number; // Sesión larga sugerida
      reasoning: string; // Explicación de por qué estas duraciones
    };
  };

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
  phaseData?: Record<string, any>;
}
