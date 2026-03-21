/**
 * Study Planner Feature Module
 * 
 * Este módulo exporta todos los componentes, servicios, hooks y tipos
 * relacionados con el planificador de estudios.
 */

// ============================================================================
// COMPONENTES
// ============================================================================

export { StudyPlannerSofLIA } from './components/StudyPlannerLIA';
export { CalendarConnection } from './components/CalendarConnection';
export { PlanSummary } from './components/PlanSummary';
export { StudyPlannerCalendar } from './components/StudyPlannerCalendar';

// ============================================================================
// SERVICIOS
// ============================================================================

export { UserContextService } from './services/user-context.service';
export { CourseAnalysisService } from './services/course-analysis.service';
export { CalendarIntegrationService } from './services/calendar-integration.service';
export { SofLIAContextService } from './services/lia-context.service';
export { ValidationService } from './services/validation.service';

// ============================================================================
// HOOKS
// ============================================================================

export { 
  useStudyPlannerSofLIA as useStudyPlannerLIA, 
  StudyPlannerPhase as LIAPhase,
  type PhaseData,
  type Message,
  type StudyPlannerSofLIAState,
  type StudyPlannerSofLIAActions,
} from './hooks/useStudyPlannerSofLIA';

export {
  useStudyPlannerDashboardSofLIA as useStudyPlannerDashboardLIA,
  type DashboardMessage,
  type StudyPlannerAction,
  type ActiveStudyPlan,
  type CalendarChange,
  type StudyPlannerDashboardState,
  type StudyPlannerDashboardActions,
} from './hooks/useStudyPlannerDashboardSofLIA';

// ============================================================================
// CONTEXTO
// ============================================================================

export { 
  StudyPlannerProvider, 
  useStudyPlanner,
  StudyPlannerPhase,
  type StudyPlannerState,
} from './context/StudyPlannerContext';

// ============================================================================
// TIPOS
// ============================================================================

export type {
  // Tipos base
  UserType,
  CourseLevel,
  AssignmentStatus,
  SessionType,
  TimeOfDay,
  CalendarProvider,
  PlanGenerationMode,
  
  // Perfil profesional
  UserRole,
  UserArea,
  UserNivel,
  EmpresaTamano,
  UserSector,
  UserRelacion,
  UserProfessionalProfile,
  
  // Organización
  OrganizationInfo,
  WorkTeam,
  
  // Cursos y lecciones
  CourseInfo,
  CourseModule,
  LessonInfo,
  LessonDuration,
  CourseComplexity,
  
  // Asignaciones
  B2BCourseAssignment,
  TeamCourseAssignment,
  B2CCoursePurchase,
  CourseAssignment,
  
  // Rutas de aprendizaje
  LearningRoute,
  LearningRouteSuggestion,
  
  // Preferencias
  StudyPreferences,
  TimeBlock,
  
  // Calendario
  CalendarIntegration,
  CalendarEvent,
  CalendarAvailability,
  
  // Usuario
  UserBasicInfo,
  UserContext,
  
  // Análisis de SofLIA
  SofLIAAvailabilityAnalysis,
  SofLIATimeAnalysis,
  
  // Plan de estudio
  StudyPlanConfig,
  StudySession,
  StudyPlan,
  
  // Respuestas de API
  ApiResponse,
  UserContextResponse,
  CoursesResponse,
  SofLIAAnalysisResponse,
  StudyPlanResponse,
} from './types/user-context.types';

// ============================================================================
// TIPOS DE SERVICIO LIA
// ============================================================================

export type {
  StudyPlannerContext as StudyPlannerLIAContext
} from './services/lia-context.service';

export type { 
  ValidationResult, 
  DeadlineValidation 
} from './services/validation.service';

