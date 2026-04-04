/**
 * Tipos TypeScript para el contexto de usuario del planificador de estudios.
 * Este archivo es el barrel que re-exporta todos los sub-módulos de tipos.
 */

// Domain-specific type modules
export * from './user-profile.types';
export * from './course-assignment.types';
export * from './study-preferences.types';
export * from './calendar-integration.types';
export * from './lia-analysis.types';
export * from './study-plan.types';

// Import what's needed to define UserContext
import type { UserBasicInfo, UserType, UserProfessionalProfile, OrganizationInfo, WorkTeam } from './user-profile.types';
import type { CourseAssignment } from './course-assignment.types';
import type { StudyPreferences } from './study-preferences.types';
import type { CalendarIntegration } from './calendar-integration.types';
import type { ApiResponse } from './study-plan.types';

/**
 * Contexto completo del usuario para el planificador
 */
export interface UserContext {
  userId?: string;
  user: UserBasicInfo;
  userType: UserType;
  professionalProfile?: UserProfessionalProfile;
  organization?: OrganizationInfo;
  workTeams?: WorkTeam[];
  courses: CourseAssignment[];
  studyPreferences?: StudyPreferences;
  calendarIntegration?: CalendarIntegration;
}

export type UserContextResponse = ApiResponse<UserContext>;
