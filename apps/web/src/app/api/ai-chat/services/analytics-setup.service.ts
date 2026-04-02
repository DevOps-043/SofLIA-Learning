/**
 * Analytics Setup Service
 * Initializes SofLIA conversation analytics asynchronously (non-blocking).
 */

import { NextRequest } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { logger } from '../../../../lib/utils/logger';
import { SofLIALogger, type ContextType } from '../../../../lib/analytics/lia-logger';
import type { CourseLessonContext } from '../../../../core/types/lia.types';

interface AnalyticsUser {
  id: string;
}

interface InitAnalyticsParams {
  user: AnalyticsUser;
  request: NextRequest;
  context: string;
  existingConversationId: string | null;
  courseContext?: CourseLessonContext;
}

interface AnalyticsResult {
  liaLogger: SofLIALogger | null;
  conversationId: string | null;
}

interface ModuleLookupRow {
  module_id: string
}

interface LessonLookupRow {
  lesson_id: string
}

interface CourseLookupRow {
  id: string
}

export async function initializeAnalyticsAsync({
  user,
  request,
  context,
  existingConversationId,
  courseContext,
}: InitAnalyticsParams): Promise<AnalyticsResult> {
  logger.info('[LIA Analytics] 🚀 Iniciando analytics para usuario:', {
    userId: user.id,
    hasExistingConversation: !!existingConversationId,
  });

  try {
    const liaLogger = new SofLIALogger(user.id);

    if (!existingConversationId) {
      logger.info('Iniciando nueva conversación SofLIA (async)', { userId: user.id, context });

      const userAgent = request.headers.get('user-agent') || undefined;
      const truncatedBrowser = userAgent ? userAgent.substring(0, 100) : undefined;

      const forwardedFor = request.headers.get('x-forwarded-for');
      const realIp = request.headers.get('x-real-ip');
      let clientIp: string | undefined;
      if (forwardedFor) {
        clientIp = forwardedFor.split(',')[0].trim();
      } else if (realIp) {
        clientIp = realIp.trim();
      }

      // Enrich IDs in courseContext if missing
      if (courseContext && context === 'course') {
        try {
          const supabase = await createClient();

          if (!courseContext.moduleId && courseContext.moduleTitle && courseContext.courseId) {
            const { data: moduleData, error: moduleError } = await supabase
              .from('course_modules')
              .select('module_id')
              .eq('course_id' as never, courseContext.courseId as never)
              .ilike('title', courseContext.moduleTitle)
              .limit(1)
              .single();
            if (moduleData && !moduleError) {
              courseContext.moduleId = (moduleData as ModuleLookupRow).module_id;
            }
          }

          if (!courseContext.lessonId && courseContext.lessonTitle && courseContext.moduleId) {
            const { data: lessonData, error: lessonError } = await supabase
              .from('course_lessons')
              .select('lesson_id')
              .eq('module_id' as never, courseContext.moduleId as never)
              .ilike('title', courseContext.lessonTitle)
              .limit(1)
              .single();
            if (lessonData && !lessonError) {
              courseContext.lessonId = (lessonData as LessonLookupRow).lesson_id;
            }
          }
        } catch (lookupError) {
          logger.warn('[Analytics Enrichment] Falló la búsqueda de IDs detallados:', lookupError);
        }
      }

      const newConversationId = await liaLogger.startConversation({
        contextType: context as ContextType,
        courseContext,
        deviceType: request.headers.get('sec-ch-ua-platform') || undefined,
        browser: truncatedBrowser,
        ipAddress: clientIp,
      });

      // Update course_id on the conversation record if available
      if (courseContext && context === 'course' && newConversationId) {
        try {
          const supabase = await createClient();
          let courseIdToUpdate: string | null = null;

          if (courseContext.courseId) {
            courseIdToUpdate = courseContext.courseId;
          } else if (courseContext.courseSlug) {
            const { data: courseData, error: courseError } = await supabase
              .from('courses')
              .select('id')
              .eq('slug' as never, courseContext.courseSlug as never)
              .single();
            if (courseData && !courseError) {
              courseIdToUpdate = (courseData as CourseLookupRow).id;
            }
          }

          if (courseIdToUpdate) {
            await supabase
              .from('lia_conversations')
              .update({ course_id: courseIdToUpdate } as never)
              .eq('conversation_id' as never, newConversationId as never);

            logger.info('✅ Actualizado course_id en conversación', {
              conversationId: newConversationId,
              courseId: courseIdToUpdate,
            });
          }
        } catch (error) {
          logger.warn('No se pudo actualizar course_id en conversación:', error);
        }
      }

      logger.info('✅ Nueva conversación SofLIA creada exitosamente (async)', {
        conversationId: newConversationId,
        userId: user.id,
        context,
      });
      return { liaLogger, conversationId: newConversationId };
    } else {
      logger.info('Continuando conversación SofLIA existente (async)', {
        conversationId: existingConversationId,
        userId: user.id,
      });
      liaLogger.setConversationId(existingConversationId);
      await liaLogger.recoverMessageSequence();
      return { liaLogger, conversationId: existingConversationId };
    }
  } catch (error) {
    logger.error('❌ Error inicializando SofLIA Analytics (async):', error);
    return { liaLogger: null, conversationId: null };
  }
}
