/**
 * Tipos TypeScript para el contexto de usuario del planificador de estudios
 * 
 * Este archivo contiene todas las interfaces y tipos necesarios para manejar
 * el contexto del usuario, tanto B2B como B2C, incluyendo perfil profesional,
 * cursos, asignaciones y preferencias de estudio.
 */

// ============================================================================
// TIPOS BASE
// ============================================================================

/**
 * Tipo de usuario en el sistema
 * - b2b: Usuario perteneciente a una organización
 * - b2c: Usuario independiente
 */
export type UserType = 'b2b' | 'b2c';

/**
 * Nivel de dificultad de un curso
 */
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';

/**
 * Estado de una asignación de curso
 */
export type AssignmentStatus = 'assigned' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';

/**
 * Tipo de sesión de estudio preferida
 */
export type SessionType = 'short' | 'medium' | 'long';

/**
 * Momento del día preferido para estudiar
 */
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

/**
 * Proveedor de calendario
 */
export type CalendarProvider = 'google' | 'microsoft';

/**
 * Modo de generación del plan
 */
export type PlanGenerationMode = 'manual' | 'ai_generated';

// ============================================================================
// INFORMACIÓN DE PERFIL PROFESIONAL
// ============================================================================

/**
 * Información del rol del usuario
 */
export interface UserRole {
  id: number;
  slug: string;
  nombre: string;
  areaId?: number;
}

/**
 * Información del área profesional
 */
export interface UserArea {
  id: number;
  slug: string;
  nombre: string;
}

/**
 * Información del nivel jerárquico
 */
export interface UserNivel {
  id: number;
  slug: string;
  nombre: string;
}

/**
 * Información del tamaño de empresa
 */
export interface EmpresaTamano {
  id: number;
  slug: string;
  nombre: string;
  minEmpleados?: number;
  maxEmpleados?: number;
}

/**
 * Información del sector empresarial
 */
export interface UserSector {
  id: number;
  slug: string;
  nombre: string;
}

/**
 * Información de la relación laboral
 */
export interface UserRelacion {
  id: number;
  slug: string;
  nombre: string;
}

/**
 * Perfil profesional completo del usuario
 */
export interface UserProfessionalProfile {
  cargoTitulo?: string;
  rol?: UserRole;
  nivel?: UserNivel;
  area?: UserArea;
  tamanoEmpresa?: EmpresaTamano;
  sector?: UserSector;
  relacion?: UserRelacion;
  pais?: string;
  dificultadId?: number;
  usoIaRespuesta?: string;
}

// ============================================================================
// INFORMACIÓN DE ORGANIZACIÓN (B2B)
// ============================================================================

/**
 * Información de la organización
 */
export interface OrganizationInfo {
  id: string;
  name: string;
  slug?: string;
  logoUrl?: string;
  industry?: string;
  size?: string;
  plan?: string;
}

/**
 * Información de un equipo de trabajo
 */
export interface WorkTeam {
  teamId: string;
  name: string;
  description?: string;
  role: 'member' | 'leader' | 'co-leader';
  status: 'active' | 'inactive';
  courseId?: string;
  memberCount?: number;
}

// ============================================================================
// INFORMACIÓN DE CURSOS Y LECCIONES
// ============================================================================

/**
 * Información básica de un curso
 */
export interface CourseInfo {
  id: string;
  title: string;
  description?: string;
  slug: string;
  category: string;
  level: CourseLevel;
  instructorId?: string;
  instructorName?: string;
  thumbnailUrl?: string;
  durationTotalMinutes: number;
  isActive: boolean;
  price?: number;
  averageRating?: number;
  studentCount?: number;
}

/**
 * Información de un módulo de curso
 */
export interface CourseModule {
  moduleId: string;
  moduleTitle: string;
  moduleDescription?: string;
  moduleOrderIndex: number;
  moduleDurationMinutes: number;
  isRequired: boolean;
  isPublished: boolean;
  lessons: LessonInfo[];
}

/**
 * Información de una lección
 */
export interface LessonInfo {
  lessonId: string;
  lessonTitle: string;
  lessonDescription?: string;
  lessonOrderIndex: number;
  durationSeconds: number;
  moduleId: string;
  isPublished: boolean;
}

/**
 * Duración calculada de una lección
 * Incluye tiempo de video, actividades, materiales e interacciones
 */
export interface LessonDuration {
  lessonId: string;
  lessonTitle: string;
  /** Duración del video en minutos */
  videoMinutes: number;
  /** Tiempo estimado para actividades en minutos */
  activitiesMinutes: number;
  /** Tiempo estimado para materiales en minutos */
  materialsMinutes: number;
  /** Tiempo de interacciones (fijo: 3 minutos) */
  interactionsMinutes: number;
  /** Tiempo total de la lección en minutos */
  totalMinutes: number;
  /** Si el tiempo fue estimado por LIA o calculado */
  isEstimated: boolean;
}

/**
 * Análisis de complejidad de un curso
 */
export interface CourseComplexity {
  courseId: string;
  level: CourseLevel;
  category: string;
  totalLessons: number;
  totalModules: number;
  totalDurationMinutes: number;
  averageLessonDuration: number;
  complexityScore: number; // 1-10, calculado por SofLIA
  recommendedSessionMinutes: number;
  recommendedBreakMinutes: number;
}

// ============================================================================
// ASIGNACIONES DE CURSOS
// ============================================================================

/**
 * Asignación de curso para usuarios B2B
 */
export interface B2BCourseAssignment {
  id: string;
  organizationId: string;
  userId: string;
  courseId: string;
  course: CourseInfo;
  assignedBy?: string;
  assignedByName?: string;
  assignedAt: string;
  dueDate?: string;
  status: AssignmentStatus;
  completionPercentage: number;
  completedAt?: string;
  message?: string;
}

/**
 * Asignación de curso por equipo de trabajo
 */
export interface TeamCourseAssignment {
  id: string;
  teamId: string;
  teamName: string;
  courseId: string;
  course: CourseInfo;
  assignedBy: string;
  assignedByName?: string;
  assignedAt: string;
  dueDate?: string;
  status: AssignmentStatus;
  message?: string;
}

/**
 * Curso adquirido por usuario B2C
 */
export interface B2CCoursePurchase {
  purchaseId: string;
  userId: string;
  courseId: string;
  course: CourseInfo;
  purchasedAt: string;
  accessStatus: 'active' | 'suspended' | 'expired' | 'cancelled';
  expiresAt?: string;
  completionPercentage?: number;
}

/**
 * Asignación de curso genérica (unión de B2B y B2C)
 */
export interface CourseAssignment {
  courseId: string;
  course: CourseInfo;
  userType: UserType;
  /** Solo para B2B */
  dueDate?: string;
  /** Solo para B2B */
  assignedBy?: string;
  status: AssignmentStatus | 'active';
  completionPercentage: number;
  source: 'organization' | 'team' | 'purchase';
}

// ============================================================================
// RUTA DE APRENDIZAJE
// ============================================================================

/**
 * Ruta de aprendizaje personalizada
 */
export interface LearningRoute {
  id: string;
  userId: string;
  name: string;
  description?: string;
  courses: CourseInfo[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Sugerencia de ruta de aprendizaje por LIA
 */
export interface LearningRouteSuggestion {
  name: string;
  description: string;
  courses: CourseInfo[];
  reason: string;
  estimatedDuration: number;
  difficulty: CourseLevel;
  skills: string[];
}

// ============================================================================
// PREFERENCIAS DE ESTUDIO
// ============================================================================

/**
 * Preferencias de estudio del usuario
 */
export interface StudyPreferences {
  id: string;
  userId: string;
  timezone: string;
  preferredTimeOfDay: TimeOfDay;
  preferredDays: number[]; // 0-6, donde 0 es domingo
  dailyTargetMinutes: number;
  weeklyTargetMinutes: number;
  preferredSessionType: SessionType;
  minSessionMinutes?: number;
  maxSessionMinutes?: number;
  breakDurationMinutes?: number;
  calendarConnected: boolean;
  calendarProvider?: CalendarProvider;
}

/**
 * Bloque de tiempo preferido
 */
export interface TimeBlock {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  dayOfWeek?: number; // 0-6
}

// ============================================================================
// CALENDARIO
// ============================================================================

/**
 * Integración de calendario
 */
export interface CalendarIntegration {
  id: string;
  userId: string;
  provider: CalendarProvider;
  isConnected: boolean;
  expiresAt?: string;
  scope?: string;
}

/**
 * Evento del calendario
 */
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  isRecurring: boolean;
  location?: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  calendarId?: string;
}

/**
 * Análisis de disponibilidad del calendario
 */
export interface CalendarAvailability {
  date: string;
  freeSlots: TimeBlock[];
  busySlots: TimeBlock[];
  totalFreeMinutes: number;
  totalBusyMinutes: number;
}

/**
 * Item de la lista de calendarios disponibles (Google o Microsoft)
 */
export interface CalendarListItem {
  id: string;
  name: string;
  isPrimary: boolean;
  accessRole: 'owner' | 'writer' | 'reader' | 'freeBusyReader';
  color?: string;
  provider: CalendarProvider;
}

/**
 * Metadata almacenada en calendar_integrations.metadata (JSONB)
 */
export interface CalendarIntegrationMetadata {
  secondary_calendar_id?: string;
  selected_calendar_ids?: string[];
}

// ============================================================================
// CONTEXTO COMPLETO DEL USUARIO
// ============================================================================

/**
 * Información básica del usuario
 */
export interface UserBasicInfo {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  profilePictureUrl?: string;
  cargoRol?: string;
  typeRol?: string;
}

/**
 * Contexto completo del usuario para el planificador
 */
export interface UserContext {
  /** ID del usuario (para detectar cambios de sesión) */
  userId?: string;
  /** Información básica del usuario */
  user: UserBasicInfo;
  /** Tipo de usuario (B2B o B2C) */
  userType: UserType;
  /** Perfil profesional completo */
  professionalProfile?: UserProfessionalProfile;
  /** Información de la organización (solo B2B) */
  organization?: OrganizationInfo;
  /** Equipos de trabajo (solo B2B) */
  workTeams?: WorkTeam[];
  /** Cursos asignados/adquiridos */
  courses: CourseAssignment[];
  /** Preferencias de estudio */
  studyPreferences?: StudyPreferences;
  /** Integración de calendario */
  calendarIntegration?: CalendarIntegration;
  /** Rutas de aprendizaje activas */
  learningRoutes?: LearningRoute[];
}

// ============================================================================
// ANÁLISIS DE SofLIA
// ============================================================================

/**
 * Análisis de disponibilidad generado por SofLIA
 */
export interface SofLIAAvailabilityAnalysis {
  /** Tiempo estimado de disponibilidad semanal en minutos */
  estimatedWeeklyMinutes: number;
  /** Tiempo mínimo sugerido por sesión en minutos */
  suggestedMinSessionMinutes: number;
  /** Tiempo máximo sugerido por sesión en minutos */
  suggestedMaxSessionMinutes: number;
  /** Tiempo de descanso sugerido en minutos */
  suggestedBreakMinutes: number;
  /** Días de la semana sugeridos para estudiar */
  suggestedDays: number[];
  /** Bloques de tiempo sugeridos */
  suggestedTimeBlocks: TimeBlock[];
  /** Razonamiento de LIA */
  reasoning: string;
  /** Factores considerados */
  factorsConsidered: {
    role: string;
    area: string;
    companySize: string;
    level: string;
    calendarAnalysis?: string;
  };
  /** Fecha del análisis */
  analyzedAt: string;
}

/**
 * Análisis de tiempos generado por SofLIA
 */
export interface SofLIATimeAnalysis {
  /** Tiempo total estimado para completar todos los cursos */
  totalEstimatedMinutes: number;
  /** Tiempo por curso */
  courseBreakdown: {
    courseId: string;
    courseTitle: string;
    estimatedMinutes: number;
    complexity: number;
  }[];
  /** Distribución sugerida de sesiones */
  sessionDistribution: {
    totalSessions: number;
    sessionsPerWeek: number;
    weeksToComplete: number;
  };
  /** Para B2B: si cumple con los plazos */
  meetsDeadlines?: boolean;
  /** Para B2B: advertencias de plazos */
  deadlineWarnings?: {
    courseId: string;
    courseTitle: string;
    dueDate: string;
    estimatedCompletionDate: string;
    isAtRisk: boolean;
    suggestedAction: string;
  }[];
  /** Razonamiento de LIA */
  reasoning: string;
  /** Fecha del análisis */
  analyzedAt: string;
}

// ============================================================================
// PLAN DE ESTUDIO
// ============================================================================

/**
 * Configuración del plan de estudio
 */
export interface StudyPlanConfig {
  name: string;
  description?: string;
  userType: UserType;
  /** IDs de cursos incluidos */
  courseIds: string[];
  /** Ruta de aprendizaje seleccionada (opcional) */
  learningRouteId?: string;
  /** Horas objetivo por semana */
  goalHoursPerWeek: number;
  /** Fecha de inicio */
  startDate?: string;
  /** Fecha de fin (opcional para B2C) */
  endDate?: string;
  /** Zona horaria */
  timezone: string;
  /** Días preferidos (0-6) */
  preferredDays: number[];
  /** Bloques de tiempo preferidos */
  preferredTimeBlocks: TimeBlock[];
  /** Tiempo mínimo de sesión en minutos */
  minSessionMinutes: number;
  /** Tiempo máximo de sesión en minutos */
  maxSessionMinutes: number;
  /** Tiempo de descanso en minutos */
  breakDurationMinutes: number;
  /** Tipo de sesión preferida */
  preferredSessionType: SessionType;
  /** Modo de generación */
  generationMode: PlanGenerationMode;
  /** Análisis de SofLIA */
  sofLiaAvailabilityAnalysis?: SofLIAAvailabilityAnalysis;
  /** Análisis de tiempos de SofLIA */
  sofLiaTimeAnalysis?: SofLIATimeAnalysis;
  /** Calendario analizado */
  calendarAnalyzed: boolean;
  /** Proveedor de calendario usado */
  calendarProvider?: CalendarProvider;
}

/**
 * Sesión de estudio programada
 */
export interface StudySession {
  id: string;
  planId: string;
  userId: string;
  title: string;
  description?: string;
  courseId: string;
  lessonId?: string;
  /** Título de la lección (para mostrar en UI) */
  lessonTitle?: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  breakDurationMinutes?: number;
  status: 'planned' | 'in_progress' | 'completed' | 'missed' | 'rescheduled';
  isAiGenerated: boolean;
  sofLiaSuggested: boolean;
  sessionType: SessionType;
  /** Fecha límite del curso (para B2B) */
  dueDate?: string;
  /** Verificado contra calendario */
  calendarConflictChecked: boolean;
}

/**
 * Plan de estudio completo
 */
export interface StudyPlan {
  id: string;
  userId: string;
  config: StudyPlanConfig;
  sessions: StudySession[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

// ============================================================================
// RESPUESTAS DE API
// ============================================================================

/**
 * Respuesta genérica de API
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Respuesta de contexto de usuario
 */
export type UserContextResponse = ApiResponse<UserContext>;

/**
 * Respuesta de cursos
 */
export type CoursesResponse = ApiResponse<CourseAssignment[]>;

/**
 * Respuesta de análisis de SofLIA
 */
export type SofLIAAnalysisResponse = ApiResponse<{
  availabilityAnalysis: SofLIAAvailabilityAnalysis;
  timeAnalysis: SofLIATimeAnalysis;
}>;

/**
 * Respuesta de plan de estudio
 */
export type StudyPlanResponse = ApiResponse<StudyPlan>;

