import type { AiTurn } from '@/lib/ai/providers'
import { logger as techDebtLogger } from '@/lib/utils/logger'
/**
 * Chat Context Builder
 *
 * Handles enriched context assembly for LIA chat requests,
 * including organization slug fallback, second-pass course loading,
 * and personalization prompt injection.
 */

import { createClient } from '../../../../lib/supabase/server';
import type { PlatformContext, ChatRequest } from './platform-context.service';
import type { CourseWithContent } from './platform-context/context.types';
import {
  loadCourseLessonTranscripts,
  loadLessonTranscriptWithTimecodes,
} from './platform-context/course-transcripts';

/** Debe coincidir con el presupuesto que aplica el prompt a la lección actual. */
const CURRENT_LESSON_TRANSCRIPT_CHARS = 30_000;
import { extractOrganizationSlugFromPage } from './organization-context.service';
import { detectTechnicalBugReportIntent } from './bug-report-intent.service';

interface AssignedCourseWithContentRow {
  course?: {
    description?: string | null;
    duration_total_minutes?: number | null;
    level?: string | null;
    slug?: string | null;
    title?: string | null;
  } | null;
}

function normalizeOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function normalizeOptionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

/**
 * Builds the full enriched context for a LIA chat request.
 * Merges platform DB context with request-provided context.
 */
export async function buildFullContext(
  platformContext: PlatformContext,
  requestContext: ChatRequest['context']
): Promise<PlatformContext> {
  // Server-resolved fields take precedence — spread order matters:
  // 1. requestContext first (client navigation/lesson data: currentPage, currentLessonContext, etc.)
  // 2. platformContext second (server DB identity/org data overrides client-supplied values)
  // This prevents the client from injecting fake org names, job titles, or org metadata.
  const resolvedUserJobTitle =
    platformContext.userJobTitle || requestContext?.userJobTitle;
  const resolvedUserJobDescription =
    platformContext.userJobDescription || requestContext?.userJobDescription;

  const fullContext: PlatformContext = {
    ...requestContext,   // client navigation context (currentPage, currentLessonContext, pageType, etc.)
    ...platformContext,  // server identity/org data wins — org name, slug, job title, courses
    // Explicit merge: server-first with client fallback for display/identity fields
    userName: platformContext.userName || requestContext?.userName,
    userJobTitle: resolvedUserJobTitle,
    userJobDescription: resolvedUserJobDescription,
  };

  // Inject server-resolved job title into lesson context so it can't be spoofed from client
  if (fullContext.currentLessonContext && resolvedUserJobTitle) {
    fullContext.currentLessonContext = {
      ...fullContext.currentLessonContext,
      userRole: resolvedUserJobTitle,
    };
  }

  // Transcripciones del curso, resueltas SIEMPRE en servidor desde la base.
  //
  // Antes al prompt solo llegaba la lección abierta, así que una pregunta sobre
  // el vídeo de una lección anterior no tenía respuesta posible. Se cargan aquí
  // (y no desde el cliente) por dos motivos: el cliente no debe poder inyectar
  // material de curso falso, y el contenido debe salir de la base, no del DOM.
  if (fullContext.currentLessonContext?.courseId) {
    const { courseId, lessonId } = fullContext.currentLessonContext;

    const [courseLessons, currentLessonTranscript] = await Promise.all([
      loadCourseLessonTranscripts({ courseId, currentLessonId: lessonId }),
      // La lección abierta también necesita sus marcas de tiempo: el contexto que
      // manda el cliente trae la transcripción en texto plano, sin segmentos.
      lessonId
        ? loadLessonTranscriptWithTimecodes(lessonId, CURRENT_LESSON_TRANSCRIPT_CHARS)
        : Promise.resolve(null),
    ]);

    if (courseLessons.length > 0 || currentLessonTranscript) {
      fullContext.currentLessonContext = {
        ...fullContext.currentLessonContext,
        ...(courseLessons.length > 0 ? { courseLessons } : {}),
        ...(currentLessonTranscript ?? {}),
      };
    }
  }

  // Fallback: extract organizationSlug from pathname only when DB resolution returned nothing
  if (!fullContext.organizationSlug && fullContext.currentPage) {
    fullContext.organizationSlug = extractOrganizationSlugFromPage(
      fullContext.currentPage
    );
  }

  if (
    fullContext.organizationId &&
    requestContext?.userId &&
    !fullContext.coursesWithContent
  ) {
    try {
      const supabase = await createClient();
      const { data: assignedCourses, error } = await supabase
        .from('organization_course_assignments')
        .select(
          'course:courses!inner(id, title, slug, description, level, duration_total_minutes)'
        )
        .eq('user_id', requestContext.userId)
        .eq('organization_id', fullContext.organizationId)
        .limit(20);

      if (error) {
        techDebtLogger.error('Error cargando cursos asignados:', error);
      } else if (assignedCourses && assignedCourses.length > 0) {
        fullContext.coursesWithContent = assignedCourses.map(
          (assignment: AssignedCourseWithContentRow): CourseWithContent => ({
            title: normalizeOptionalString(assignment.course?.title),
            slug: normalizeOptionalString(assignment.course?.slug),
            description: normalizeOptionalString(assignment.course?.description),
            level: normalizeOptionalString(assignment.course?.level),
            durationMinutes: normalizeOptionalNumber(assignment.course?.duration_total_minutes),
            isAssigned: true,
          })
        );
      } else {
        fullContext.coursesWithContent = [];
        fullContext.noCoursesAssigned = true;
      }
    } catch (err) {
      techDebtLogger.error('Error en segunda carga de cursos:', err);
    }
  }

  return fullContext;
}

/**
 * Appends LIA personalization settings to the base system prompt.
 */
/**
 * Sección de personalización del usuario, o cadena vacía si no tiene ninguna.
 *
 * Devuelve el FRAGMENTO en lugar de concatenarlo sobre el prompt recibido: el
 * prompt base depende del dialecto del proveedor, que solo se conoce dentro del
 * gateway, mientras que esta consulta es asíncrona y debe resolverse antes. Al
 * separar "obtener el contenido" de "componer el prompt", lo asíncrono ocurre
 * fuera y la composición queda síncrona.
 */
export async function buildPersonalizationSection(userId: string): Promise<string> {
  try {
    const { SofLIAPersonalizationService } = await import(
      '@/core/services/lia-personalization.service'
    );
    const personalizationSettings =
      await SofLIAPersonalizationService.getSettings(userId);
    if (personalizationSettings) {
      return SofLIAPersonalizationService.buildPersonalizationPrompt(
        personalizationSettings
      );
    }
  } catch (error) {
    techDebtLogger.warn('Error cargando personalizacion de LIA:', error);
  }
  return '';
}

/**
 * Contexto técnico de la página, solo cuando el mensaje del usuario parece
 * reportar un fallo de la plataforma. Cadena vacía en cualquier otro caso.
 *
 * Igual que `buildPersonalizationSection`, devuelve el fragmento y no el prompt
 * concatenado, para que la composición final pueda depender del dialecto.
 */
export async function buildBugReportContextSection(
  lastMessageContent: string,
  isBugReportFlag: boolean,
  currentPage?: string,
  requestContext?: ChatRequest['context'],
  hasPendingDraft = false
): Promise<string> {
  const { isBugReport } = detectTechnicalBugReportIntent({
    message: lastMessageContent,
    isBugReportFlag,
    requestContext,
    hasPendingDraft,
  });

  if (!isBugReport || !currentPage) return '';

  try {
    const { PageContextService } = await import(
      '../../../../lib/lia-context/services/page-context.service'
    );
    const bugContext = PageContextService.buildBugReportContext(currentPage);
    if (bugContext && !bugContext.includes('No hay metadata')) {
      return `---\n\n${bugContext}`;
    }
  } catch (error) {
    techDebtLogger.warn('Error obteniendo contexto de bug:', error);
  }

  return '';
}

/**
 * Prepara el historial de conversación en el formato neutral del gateway de IA.
 *
 * Elimina los mensajes de sistema, descarta el último mensaje del usuario (que
 * viaja como prompt del turno) y fusiona turnos consecutivos del mismo rol.
 *
 * El historial DEBE empezar por un turno del usuario: Gemini rechaza un
 * historial que abra con un turno del asistente, así que se recortan los turnos
 * iniciales del asistente en lugar de dejar que el proveedor falle.
 */
export function buildCleanHistory(
  messages: Array<{ role: string; content: string }>
): AiTurn[] {
  let history: AiTurn[] = messages
    .filter((m) => m.role !== 'system')
    .slice(0, -1)
    .map((m) => ({
      parts: [{ text: m.content, type: 'text' as const }],
      role: m.role === 'assistant' ? 'assistant' : 'user',
    }));

  while (history.length > 0 && history[0].role === 'assistant') {
    history = history.slice(1);
  }

  const cleanHistory: AiTurn[] = [];
  for (const msg of history) {
    const lastMsg = cleanHistory[cleanHistory.length - 1];
    const lastPart = lastMsg?.parts[0];

    if (lastMsg && lastMsg.role === msg.role && lastPart?.type === 'text') {
      lastPart.text += '\n' + msg.parts.map((part) => (part.type === 'text' ? part.text : '')).join('');
    } else {
      cleanHistory.push(msg);
    }
  }

  return cleanHistory;
}
