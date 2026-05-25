/**
 * CourseContextProvider
 * 
 * Provider de contexto especializado para páginas de cursos.
 * Proporciona información sobre el curso actual, lección, progreso
 * y contexto de aprendizaje para LIA.
 */

import { BaseContextProvider } from '../base/BaseContextProvider';
import type { ContextFragment, ContextBuildOptions, EnrichedMetadata } from '../../types';

export interface CourseContext {
  courseId?: string;
  courseSlug?: string;
  courseName?: string;
  lessonId?: string;
  lessonTitle?: string;
  moduleId?: string;
  moduleName?: string;
  progress?: number;
  transcript?: string;
  summary?: string;
}

export class CourseContextProvider extends BaseContextProvider {
  readonly name = 'course';
  readonly priority = 60; // Prioridad alta para contexto de cursos

  async getContext(options: ContextBuildOptions): Promise<ContextFragment | null> {
    const { currentPage, enrichedMetadata } = options;

    // Solo incluir si estamos en una página de curso
    if (!this.isCourseRelatedPage(currentPage)) {
      return null;
    }

    // Extraer contexto del curso desde enrichedMetadata o la URL
    const courseContext = this.extractCourseContext(currentPage, enrichedMetadata);
    
    if (!courseContext) {
      return null;
    }

    const content = this.buildCourseContextContent(courseContext);

    return {
      type: 'course',
      content,
      priority: this.priority,
      tokens: this.estimateTokens(content),
    };
  }

  shouldInclude(contextType: string): boolean {
    return ['general', 'course', 'lesson', 'learning', 'help'].includes(contextType);
  }

  /**
   * Verifica si la página actual está relacionada con cursos
   */
  private isCourseRelatedPage(currentPage?: string): boolean {
    if (!currentPage) return false;
    
    const coursePatterns = [
      /\/courses\/[^/]+\/learn/,           // /courses/[slug]/learn
      /\/courses\/[^/]+$/,                 // /courses/[slug]
      /\/my-courses/,                      // /my-courses
      /\/business-user\/dashboard/,        // Dashboard con cursos
    ];

    return coursePatterns.some(pattern => pattern.test(currentPage));
  }

  /**
   * Extrae información del curso desde la URL o metadata
   */
  private extractCourseContext(
    currentPage?: string,
    enrichedMetadata?: EnrichedMetadata
  ): CourseContext | null {
    const context: CourseContext = {};

    // Extraer de la URL
    if (currentPage) {
      // Patrón: /courses/[slug]/learn
      const courseMatch = currentPage.match(/\/courses\/([^/]+)/);
      if (courseMatch) {
        context.courseSlug = courseMatch[1];
      }

      // Patrón: /courses/[slug]/lessons/[lessonId]
      const lessonMatch = currentPage.match(/\/lessons\/([^/]+)/);
      if (lessonMatch) {
        context.lessonId = lessonMatch[1];
      }
    }

    // Extraer de enrichedMetadata si está disponible
    if (enrichedMetadata?.courseContext) {
      Object.assign(context, enrichedMetadata.courseContext);
    }

    // Solo retornar si hay algún dato útil
    if (Object.keys(context).length === 0) {
      return null;
    }

    return context;
  }

  /**
   * Construye el contenido del contexto de curso
   */
  private buildCourseContextContent(context: CourseContext): string {
    const sections: string[] = [];

    sections.push('## CONTEXTO DEL CURSO\n');

    if (context.courseName || context.courseSlug) {
      sections.push(`**Curso:** ${context.courseName || context.courseSlug}`);
    }

    if (context.moduleName) {
      sections.push(`**Módulo actual:** ${context.moduleName}`);
    }

    if (context.lessonTitle) {
      sections.push(`**Lección actual:** ${context.lessonTitle}`);
    }

    if (context.progress !== undefined) {
      sections.push(`**Progreso:** ${context.progress}%`);
    }

    // Agregar instrucciones para LIA
    sections.push('\n### Instrucciones para SofLIA en contexto de curso:');
    sections.push('- El usuario está en una página de aprendizaje');
    sections.push('- Responde preguntas relacionadas con el contenido del curso');
    sections.push('- Si hay transcripción disponible, úsala para dar respuestas precisas');
    sections.push('- Sugiere repasar lecciones anteriores si es necesario');

    if (context.transcript) {
      // Limitar transcripción para no exceder tokens
      const truncatedTranscript = context.transcript.substring(0, 2000);
      sections.push(`\n### Transcripción de la lección (parcial):\n${truncatedTranscript}`);
      if (context.transcript.length > 2000) {
        sections.push('...[transcripción truncada]');
      }
    }

    if (context.summary) {
      sections.push(`\n### Resumen de la lección:\n${context.summary}`);
    }

    return sections.join('\n');
  }
}

export default CourseContextProvider;
