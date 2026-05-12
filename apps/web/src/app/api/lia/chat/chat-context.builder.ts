/**
 * Chat Context Builder
 *
 * Handles enriched context assembly for LIA chat requests,
 * including organization slug fallback, second-pass course loading,
 * and personalization prompt injection.
 */

import { createClient } from '../../../../lib/supabase/server';
import type { PlatformContext, ChatRequest } from './platform-context.service';
import { extractOrganizationSlugFromPage } from './organization-context.service';
import { detectTechnicalBugReportIntent } from './bug-report-intent.service';

/**
 * Builds the full enriched context for a LIA chat request.
 * Merges platform DB context with request-provided context.
 */
export async function buildFullContext(
  platformContext: PlatformContext,
  requestContext: ChatRequest['context']
): Promise<PlatformContext> {
  const resolvedUserJobTitle =
    platformContext.userJobTitle || requestContext?.userJobTitle;
  const fullContext: PlatformContext = {
    ...platformContext,
    ...requestContext,
    userName: requestContext?.userName || platformContext.userName,
    userJobTitle: resolvedUserJobTitle,
  };

  if (fullContext.currentLessonContext && resolvedUserJobTitle) {
    fullContext.currentLessonContext = {
      ...fullContext.currentLessonContext,
      userRole: resolvedUserJobTitle,
    };
  }

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
        console.error('Error cargando cursos asignados:', error);
      } else if (assignedCourses && assignedCourses.length > 0) {
        fullContext.coursesWithContent = assignedCourses.map(
          (
            assignment: Record<string, unknown> & {
              course?: Record<string, unknown>;
            }
          ) => ({
            title: assignment.course?.title,
            slug: assignment.course?.slug,
            description: assignment.course?.description,
            level: assignment.course?.level,
            durationMinutes: assignment.course?.duration_total_minutes,
            isAssigned: true,
          })
        );
      } else {
        fullContext.coursesWithContent = [];
        fullContext.noCoursesAssigned = true;
      }
    } catch (err) {
      console.error('Error en segunda carga de cursos:', err);
    }
  }

  return fullContext;
}

/**
 * Appends LIA personalization settings to the base system prompt.
 */
export async function appendPersonalizationPrompt(
  basePrompt: string,
  userId: string
): Promise<string> {
  try {
    const { SofLIAPersonalizationService } = await import(
      '@/core/services/lia-personalization.service'
    );
    const personalizationSettings =
      await SofLIAPersonalizationService.getSettings(userId);
    if (personalizationSettings) {
      const personalizationPrompt =
        SofLIAPersonalizationService.buildPersonalizationPrompt(
          personalizationSettings
        );
      return basePrompt + personalizationPrompt;
    }
  } catch (error) {
    console.warn('Error cargando personalizacion de LIA:', error);
  }
  return basePrompt;
}

/**
 * Optionally appends bug-report context to the system prompt
 * when the user's message has a technical platform issue intent.
 */
export async function appendBugReportContext(
  systemPrompt: string,
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

  if (isBugReport && currentPage) {
    try {
      const { PageContextService } = await import(
        '../../../../lib/lia-context/services/page-context.service'
      );
      const bugContext = PageContextService.buildBugReportContext(currentPage);
      if (bugContext && !bugContext.includes('No hay metadata')) {
        return systemPrompt + '\n\n---\n\n' + bugContext;
      }
    } catch (error) {
      console.warn('Error obteniendo contexto de bug:', error);
    }
  }

  return systemPrompt;
}

/**
 * Prepares the clean Gemini chat history from the messages array.
 * Removes system messages, drops the last user message, and deduplicates consecutive roles.
 */
export function buildCleanHistory(
  messages: Array<{ role: string; content: string }>
): Array<{ role: string; parts: [{ text: string }] }> {
  let history = messages
    .filter((m) => m.role !== 'system')
    .slice(0, -1)
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }] as [{ text: string }],
    }));

  while (history.length > 0 && history[0].role === 'model') {
    history = history.slice(1);
  }

  const cleanHistory: typeof history = [];
  for (const msg of history) {
    const lastMsg = cleanHistory[cleanHistory.length - 1];
    if (lastMsg && lastMsg.role === msg.role) {
      lastMsg.parts[0].text += '\n' + msg.parts[0].text;
    } else {
      cleanHistory.push(msg);
    }
  }

  return cleanHistory;
}
