import type { NanoBananaSchema, NanoBananaDomain, OutputFormat } from '../../lib/nanobana/templates';
import type { LiaImageAttachment } from '../reporting/report-problem.contract';

// Tipos compartidos para SofLIA

/**
 * Información de módulo para contexto
 */
export interface ModuleInfo {
  moduleId: string;
  moduleTitle: string;
  moduleDescription?: string;
  moduleOrderIndex: number;
  lessons: LessonInfo[];
}

/**
 * Información de lección para contexto
 */
export interface LessonInfo {
  lessonId: string;
  lessonTitle: string;
  lessonDescription?: string;
  lessonOrderIndex: number;
  durationSeconds?: number;
  totalDurationMinutes?: number; // Tiempo total: video + materiales + actividades
}

export interface LessonActivityContextItem {
  title: string;
  type: string;
  description?: string;
  isRequired: boolean;
  isCompleted: boolean;
}

export interface LessonMaterialContextItem {
  title: string;
  type: string;
  description?: string;
  isRequired: boolean;
}

export interface LessonQuizContextItem {
  id: string;
  title: string;
  type: string;
  isCompleted: boolean;
  isPassed: boolean;
  percentage: number;
}

/**
 * Contexto para cursos y talleres
 * Soporta tanto cursos como talleres (que usan la misma estructura de BD)
 */
export interface CourseLessonContext {
  // Tipo de contexto para diferenciar entre curso y taller
  contextType?: 'course' | 'workshop';

  // Información del curso/taller
  courseId?: string;
  courseSlug?: string;
  courseTitle?: string;
  courseDescription?: string;

  // Módulo y lección actual
  moduleId?: string;
  moduleTitle?: string;
  lessonId?: string; // Hacer preguntas a SofLIA sobre el contenido
  lessonTitle?: string;
  lessonDescription?: string;

  // Contenido de la lección actual
  transcriptContent?: string;
  summaryContent?: string;
  videoTime?: number;
  durationSeconds?: number;
  totalDurationMinutes?: number;
  currentPage?: string;
  currentTab?: string;

  // Metadatos completos del curso/taller (módulos y lecciones disponibles)
  allModules?: ModuleInfo[];

  // Información del usuario
  userRole?: string;

  // Detección de dificultades
  difficultyDetected?: {
    patterns: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
    }>;
    overallScore: number;
    shouldIntervene: boolean;
    suggestedHelpType?: string;
  };

  // Contexto de actividades
  activitiesContext?: {
    totalActivities: number;
    requiredActivities: number;
    completedActivities: number;
    pendingRequiredCount: number;
    pendingRequiredTitles?: string;
    activityTypes?: LessonActivityContextItem[];
    currentActivityFocus?: {
      title: string;
      type: string;
      isRequired: boolean;
      isCompleted?: boolean;
      description: string;
      prompts?: string[];
    } | null;
  };

  // Contexto de materiales
  materialsContext?: {
    totalMaterials: number;
    requiredMaterials: number;
    materialTypes?: LessonMaterialContextItem[];
  };

  // Estado de quizzes requeridos
  quizContext?: {
    hasRequiredQuizzes: boolean;
    totalRequiredQuizzes: number;
    completedQuizzes: number;
    passedQuizzes: number;
    allQuizzesPassed: boolean;
    quizzes?: LessonQuizContextItem[];
  };

  // Contexto de comportamiento del usuario
  userBehaviorContext?: string;

  // Contexto de progreso de aprendizaje
  learningProgressContext?: {
    currentLessonNumber: number;
    totalLessons: number;
    progressPercentage: number;
    currentTab: string;
    timeInCurrentLesson: string;
  };
}

// Interfaz para NanoBanana generado
export interface GeneratedNanoBananaData {
  schema: NanoBananaSchema;
  jsonString: string;
  domain: NanoBananaDomain;
  outputFormat: OutputFormat;
}

export interface SofLIAMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: LiaImageAttachment[];
  // 🎨 Datos de NanoBanana generado (opcional)
  generatedNanoBanana?: GeneratedNanoBananaData;
}
