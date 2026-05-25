import type { NanoBananaSchema, NanoBananaDomain, OutputFormat } from '../../lib/nanobana/templates';
import type { LiaImageAttachment } from '../reporting/report-problem.contract';

export type {
  CourseActivitiesContext,
  CourseLearningProgressContext,
  CourseLessonContext,
  LessonInfo,
  ModuleInfo,
} from './soflia-course-context.types';

// Tipos compartidos para SofLIA

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
  // 🎨 Datos de NanoBanana generado (opcional)
  generatedNanoBanana?: GeneratedNanoBananaData;
  // 📎 Adjuntos (evidencia visual, etc.)
  attachments?: LiaImageAttachment[];
}
