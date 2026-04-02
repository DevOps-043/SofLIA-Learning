import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../../../lib/utils/logger';
import { createClient } from '../../../lib/supabase/server';
import type { CourseLessonContext } from '../../../core/types/lia.types';
import { checkRateLimit } from '../../../core/lib/rate-limit';
import type { Database } from '../../../lib/supabase/types';
import { SessionService } from '../../../features/auth/services/session.service';
import { SofLIAContextService } from '../../../features/study-planner/services/lia-context.service';
import { SofLIAPersonalizationService } from '../../../core/services/lia-personalization.service';
import { getContextPrompt, type PageContext } from './system-prompt.service';
import { callOpenAI, callGemini, generateAIResponse } from './ai-provider.service';
import { initializeAnalyticsAsync } from './services/analytics-setup.service';
import { SofLIALogger } from '../../../lib/analytics/lia-logger';
import {
  normalizeAiChatRequest,
  resolveRequestLanguage,
  type RequestUserInfo,
} from './services/request-normalization.service';
import {
  buildDefaultProposedSlots,
  detectScheduleChangeRequest,
  detectStudyScheduleConfig,
} from './services/study-schedule.service';
import { validateProposedSchedule } from './services/calendar-validation.service';
import { sanitizeAssistantResponse } from './services/response-sanitizer.service';

type ChatUserInfo = Pick<
  Database['public']['Tables']['users']['Row'],
  'display_name' | 'username' | 'first_name' | 'last_name' | 'profile_picture_url' | 'type_rol'
>;

type PendingLesson = {
  moduleTitle: string
  lessonTitle: string
  courseTitle: string
  durationMinutes?: number
}

type StudyPlannerPageUserContext = NonNullable<PageContext['userContext']> & {
  pendingLessonsWithNames?: PendingLesson[]
  totalPendingLessons?: number
}

export async function POST(request: NextRequest) {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const googleApiKey = process.env.GOOGLE_API_KEY;

  try {
    // âœ… CORRECCIÃ“N 6: Rate limiting especÃ­fico para OpenAI
    // 10 requests por minuto por usuario
    const rateLimitResult = checkRateLimit(request, {
      maxRequests: 10,
      windowMs: 60 * 1000, // 1 minuto
      message: 'Demasiadas solicitudes al chatbot. Por favor, espera un momento.'
    }, 'openai');

    if (!rateLimitResult.success) {
      return rateLimitResult.response!;
    }

    const supabase = await createClient();

    // âœ… CORRECCIÃ“N: Usar SessionService para obtener usuario autenticado (compatible con refresh tokens)
    const user = await SessionService.getCurrentUser();

    // Permitir acceso sin autenticaciÃ³n para usuarios no loggeados (sin analytics)
    if (user) {
      logger.info('Usuario autenticado en /api/ai-chat', { userId: user.id, username: user.username });
    } else {
      logger.info('Usuario no autenticado - chat sin analytics');
    }

    let requestBody;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      logger.error('âŒ Error parseando el body del request:', parseError);
      return NextResponse.json(
        {
          error: 'Error al parsear el body del request',
          message: parseError instanceof Error ? parseError.message : 'Error desconocido'
        },
        { status: 400 }
      );
    }

    const normalizedRequest = normalizeAiChatRequest(requestBody as {
      message: string;
      context?: string;
      conversationHistory?: Array<{ role: string; content: string }>;
      userName?: string;
      userInfo?: RequestUserInfo;
      courseContext?: CourseLessonContext;
      workshopContext?: CourseLessonContext;
      pageContext?: PageContext;
      isSystemMessage?: boolean;
      conversationId?: string;
      language?: string;
      isPromptMode?: boolean;
    });

    if (normalizedRequest.error) {
      logger.error('âŒ Request invÃ¡lido en /api/ai-chat', normalizedRequest.error);
      return NextResponse.json(
        {
          error: normalizedRequest.error.error,
          message: normalizedRequest.error.message
        },
        { status: normalizedRequest.error.status }
      );
    }

    const {
      message,
      context,
      conversationHistory,
      userName,
      userInfo: userInfoFromRequest,
      courseContext,
      workshopContext,
      pageContext,
      isSystemMessage,
      conversationId: existingConversationId,
      languageFromRequest,
      isPromptMode
    } = normalizedRequest.data!;

    const language = resolveRequestLanguage(message, languageFromRequest);

    // Log para debugging (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      logger.log(`ðŸŒ Idioma de plataforma: ${languageFromRequest}, usando: ${language}`);
    }

    const limitedHistory = conversationHistory;

    // âœ… OPTIMIZACIÃ“N: Usar informaciÃ³n del usuario del request body si estÃ¡ disponible, evitando consulta a BD
    let userInfo: ChatUserInfo | null = null;
    if (userInfoFromRequest) {
      // Usar informaciÃ³n del frontend (mÃ¡s rÃ¡pido, no requiere consulta a BD)
      userInfo = userInfoFromRequest as ChatUserInfo;
    } else if (user) {
      // Fallback: consultar BD solo si no viene informaciÃ³n del frontend
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('display_name, username, first_name, last_name, profile_picture_url, type_rol')
        .eq('id', user.id)
        .single();

      if (userData && !userDataError) {
        userInfo = userData as ChatUserInfo;
      }
    }

    // Obtener el mejor nombre disponible para personalizaciÃ³n (solo primer nombre)
    const displayName = userInfo?.first_name ||
      userInfo?.display_name ||
      userInfo?.username ||
      userName ||
      'usuario';

    // Obtener el rol del usuario
    const userRole = userInfo?.type_rol || courseContext?.userRole || undefined;

    // Si hay rol en courseContext pero no en userInfo, actualizar courseContext
    if (courseContext && userRole && !courseContext.userRole) {
      courseContext.userRole = userRole;
    }

    // âœ… Detectar si es el primer mensaje de la conversaciÃ³n
    const isFirstMessage = !conversationHistory || conversationHistory.length === 0;

    // âœ… Si estÃ¡ en modo prompt, usar el contexto 'prompts'
    const effectiveContext = isPromptMode ? 'prompts' : context;

    // FORZAR ESPAÃ‘OL para study-planner siempre
    const effectiveLanguage = (effectiveContext === 'study-planner' || effectiveContext === 'study-planner-availability') ? 'es' : language;

    // Obtener contexto detallado para el planificador de estudios
    let studyPlannerContextString = '';
    if (effectiveContext === 'study-planner' && user) {
      try {
        logger.info('ðŸ“š Construyendo contexto detallado del planificador de estudios para SofLIA', { userId: user.id });
        const studyPlannerContext = await SofLIAContextService.buildStudyPlannerContext(user.id);
        studyPlannerContextString = SofLIAContextService.formatContextForPrompt(studyPlannerContext);
        logger.info('âœ… Contexto del planificador construido exitosamente', {
          coursesCount: studyPlannerContext.courses.length,
          hasModules: studyPlannerContext.courses.some(c => c.modules && c.modules.length > 0)
        });
      } catch (error) {
        logger.error('âŒ Error construyendo contexto del planificador:', error);
        // Continuar sin el contexto detallado si hay error
      }
    }

    // Obtener el prompt de contexto especÃ­fico con el nombre del usuario, rol, contexto de curso/taller y contexto de pÃ¡gina
    let contextPrompt = getContextPrompt(effectiveContext, displayName, courseContext, workshopContext, pageContext, userRole, effectiveLanguage, isFirstMessage, studyPlannerContextString);

    // âœ… VALIDACIÃ“N DE HORARIOS: Detectar y validar solicitudes de cambio de horarios
    if (context === 'study-planner' && user) {
      const scheduleChangeRequest = detectScheduleChangeRequest(message);

      if (scheduleChangeRequest.isScheduleChange) {
        logger.info('ðŸ• Detectada solicitud de cambio de horarios', { proposedTime: scheduleChangeRequest.proposedTime });

        const proposedSlots = buildDefaultProposedSlots(scheduleChangeRequest.proposedTime);

        const validation = await validateProposedSchedule({
          userId: user.id,
          proposedSlots,
          origin: request.nextUrl.origin
        });

        if (validation.hasConflicts) {
          // Agregar conflictos al contexto para que SofLIA los conozca
          contextPrompt += `\n\nâš ï¸ CONFLICTOS DETECTADOS:\n`;
          validation.conflicts.forEach(conflict => {
            contextPrompt += `- ${conflict.date} a las ${conflict.time}: ${conflict.event}\n`;
          });
          contextPrompt += `\nðŸš¨ INSTRUCCIÃ“N IMPORTANTE: ADVIERTE al usuario sobre estos conflictos con eventos existentes.\n`;
          contextPrompt += `NO rechaces el cambio completamente. En su lugar:\n`;
          contextPrompt += `1. Muestra claramente los eventos que se solapan\n`;
          contextPrompt += `2. Pregunta si desea continuar de todos modos\n`;
          contextPrompt += `3. Sugiere horarios alternativos que estÃ©n libres\n`;

          logger.info('âš ï¸ Conflictos encontrados', { conflictCount: validation.conflicts.length });
        } else {
          // Sin conflictos - agregar confirmaciÃ³n
          contextPrompt += `\n\nâœ… VALIDACIÃ“N: Los horarios propuestos estÃ¡n disponibles (sin conflictos).\n`;
          logger.info('âœ… Horarios disponibles sin conflictos');
        }
      }
    }

    const studyPlannerUserContext = pageContext?.userContext as StudyPlannerPageUserContext | null | undefined;

    // âœ… NUEVO: Incluir lecciones pendientes con nombres reales en el contexto
    logger.info('ðŸ” [AI-CHAT] Verificando lecciones pendientes en pageContext...', {
      hasPageContext: !!pageContext,
      hasUserContext: !!studyPlannerUserContext,
      hasPendingLessons: Array.isArray(studyPlannerUserContext?.pendingLessonsWithNames),
      pendingLessonsCount: studyPlannerUserContext?.pendingLessonsWithNames?.length || 0,
    });

    if (context === 'study-planner' && Array.isArray(studyPlannerUserContext?.pendingLessonsWithNames)) {
      const pendingLessons = studyPlannerUserContext.pendingLessonsWithNames;
      const totalPending = studyPlannerUserContext.totalPendingLessons || pendingLessons.length;

      if (pendingLessons.length > 0) {
        logger.info('ðŸ“š [AI-CHAT] Lecciones recibidas (primeras 3):', pendingLessons.slice(0, 3));
        contextPrompt += `\n\nðŸ“š LECCIONES PENDIENTES DEL CURSO (${totalPending} total):\n`;
        contextPrompt += `IMPORTANTE: Usa estos nombres EXACTOS al generar el plan de estudios. NUNCA uses "SesiÃ³n 1, 2, 3...".\n\n`;

        // Agrupar por mÃ³dulo
        // Agrupar por mÃ³dulo
        const lessonsByModule: Record<string, PendingLesson[]> = {};
        pendingLessons.forEach((lesson) => {
          if (!lessonsByModule[lesson.moduleTitle]) {
            lessonsByModule[lesson.moduleTitle] = [];
          }
          lessonsByModule[lesson.moduleTitle].push(lesson);
        });

        Object.entries(lessonsByModule).forEach(([moduleTitle, lessons]) => {
          contextPrompt += `ðŸ“ ${moduleTitle}:\n`;
          lessons.forEach((lesson, idx) => {
            const dur = lesson.durationMinutes ? ` (${lesson.durationMinutes} min base)` : '';
            contextPrompt += `   ${idx + 1}. ${lesson.lessonTitle}${dur}\n`;
          });
          contextPrompt += `\n`;
        });

        contextPrompt += `\nâš ï¸ INSTRUCCIÃ“N: Al generar horarios, usa EXACTAMENTE los nombres de lecciones listados arriba y CALCULA LA DURACIÃ“N FINAL usando el multiplicador seleccionado.\n`;
        contextPrompt += `Ejemplo: Si la lecciÃ³n dice "(30 min base)" y el multiplicador es 1.4, el bloque dura 42 min (ej: 10:00 - 10:42).\n`;

        logger.info('ðŸ“š Lecciones pendientes agregadas al contexto', {
          totalLessons: totalPending,
          modulesCount: Object.keys(lessonsByModule).length
        });

        // âœ… PRE-CÃLCULO DE SESIONES: Detectar si el usuario proporcionÃ³ dÃ­as y horarios
        const scheduleConfig = detectStudyScheduleConfig(message);

        if (scheduleConfig.detected) {
          logger.info('ðŸ“… [AI-CHAT] DÃ­as y horarios detectados:', {
            studyDays: scheduleConfig.studyDays,
            timeSlots: scheduleConfig.timeSlots
          });

          // Preparar lecciones para el pre-cÃ¡lculo con Ã­ndices
          const lessonsForCalculation = pendingLessons.map((lesson, index: number) => {
            // Intentar extraer el nÃºmero de lecciÃ³n del tÃ­tulo (ej: "LecciÃ³n 1.1" -> 1.1)
            const lessonMatch = lesson.lessonTitle.match(/(?:LecciÃ³n|Leccion)\s*(\d+(?:\.\d+)?)/i);
            let lessonOrderIndex = index + 1; // Fallback al Ã­ndice secuencial

            if (lessonMatch) {
              lessonOrderIndex = parseFloat(lessonMatch[1]);
            }

            return {
              lessonTitle: lesson.lessonTitle,
              lessonOrderIndex,
              moduleTitle: lesson.moduleTitle,
              durationMinutes: lesson.durationMinutes || 15
            };
          });

          // Obtener fecha lÃ­mite del contexto si existe
          const targetDateStr = studyPlannerUserContext?.targetDate;
          const targetDate = targetDateStr ? new Date(targetDateStr) : undefined;

          // Pre-calcular las sesiones
          const preCalculatedPlan = SofLIAContextService.preCalculateStudySessions(
            lessonsForCalculation,
            {
              studyDays: scheduleConfig.studyDays,
              timeSlots: scheduleConfig.timeSlots,
              startDate: new Date(),
              targetDate
            }
          );

          if (preCalculatedPlan.sessions.length > 0) {
            logger.info('âœ… [AI-CHAT] Plan pre-calculado exitosamente:', {
              totalSessions: preCalculatedPlan.summary.totalSessions,
              totalWeeks: preCalculatedPlan.summary.totalWeeks,
              totalLessons: preCalculatedPlan.summary.totalLessons,
              finishDate: preCalculatedPlan.summary.finishDate
            });

            // Agregar el plan pre-calculado al contexto
            const preCalculatedPrompt = SofLIAContextService.formatPreCalculatedSessionsForPrompt(preCalculatedPlan);
            contextPrompt += preCalculatedPrompt;

            // Agregar instrucciÃ³n explÃ­cita de que debe copiar este plan
            contextPrompt += `\n\nðŸš¨ INSTRUCCIÃ“N CRÃTICA PARA SofLIA ðŸš¨\n`;
            contextPrompt += `El plan de arriba ya estÃ¡ COMPLETAMENTE CALCULADO.\n`;
            contextPrompt += `- Las horas de fin son EXACTAS (ya calculadas con aritmÃ©tica precisa)\n`;
            contextPrompt += `- Las lecciones decimales ya estÃ¡n AGRUPADAS correctamente\n`;
            contextPrompt += `- El nÃºmero de semanas es CORRECTO\n`;
            contextPrompt += `- Los dÃ­as son EXACTAMENTE los que el usuario pidiÃ³: ${scheduleConfig.studyDays.join(', ')}\n`;
            contextPrompt += `\nTU TRABAJO: Presenta este plan tal cual, con buen formato. NO recalcules NADA.\n`;
            contextPrompt += `Si modificas las horas o los dÃ­as, ESTARÃS COMETIENDO UN ERROR.\n`;
          }
        }
      }
    }


    // âœ… OPTIMIZACIÃ“N: Inicializar analytics de forma asÃ­ncrona para no bloquear el procesamiento del mensaje
    let conversationId: string | null = existingConversationId || null;

    // Iniciar inicialización de analytics en background (no esperar)
    const analyticsPromise = user
      ? initializeAnalyticsAsync({ user, request, context, existingConversationId: conversationId, courseContext })
      : Promise.resolve({ liaLogger: null, conversationId: null });

    // âœ… Cargar configuraciÃ³n de personalizaciÃ³n de SofLIA
    let personalizationPrompt = '';
    if (user) {
      try {
        const personalizationSettings = await SofLIAPersonalizationService.getSettings(user.id);
        if (personalizationSettings) {
          personalizationPrompt = SofLIAPersonalizationService.buildPersonalizationPrompt(personalizationSettings);
          // Agregar la personalizaciÃ³n al contextPrompt
          contextPrompt += personalizationPrompt;
          logger.info('âœ… PersonalizaciÃ³n de SofLIA aplicada', {
            userId: user.id,
            baseStyle: personalizationSettings.base_style,
            hasCustomInstructions: !!personalizationSettings.custom_instructions,
          });
        }
      } catch (error) {
        // No fallar si hay error cargando personalizaciÃ³n, solo loguear
        logger.warn('âš ï¸ Error cargando personalizaciÃ³n de SofLIA:', error);
      }
    }

    // Intentar usar OpenAI si estÃ¡ disponible
    let response: string;
    const hasCourseContext = context === 'course' && courseContext !== undefined;
    const userId = user?.id || null; // Obtener userId para registro de uso

    let responseMetadata: { tokensUsed?: number; promptTokens?: number; completionTokens?: number; costUsd?: number; promptCostUsd?: number; completionCostUsd?: number; modelUsed?: string; responseTimeMs?: number } | undefined;

    if (openaiApiKey) {
      try {
        const startTime = Date.now();
        if (context === 'study-planner' || context === 'study-planner-availability') {
          logger.info('ðŸ“‹ [STUDY_PLANNER] Mensaje enviado a OpenAI (FULL):', message);
        }
        logger.info('ðŸ”¥ Llamando a OpenAI', { message: message.substring(0, 50), hasKey: !!openaiApiKey });
        // âœ… OPTIMIZACIÃ“N: Pasar contexto a callOpenAI para optimizaciones especÃ­ficas
        // FORZAR ESPAÃ‘OL para study-planner siempre
        const effectiveLanguage = (context === 'study-planner' || context === 'study-planner-availability') ? 'es' : language;

        // SWITCH DE MODELOS: Usar Gemini para Study Planner y contextos generales/cursos si estÃ¡ configurado
        const shouldUseGemini = (
          context === 'study-planner' || 
          context === 'study-planner-availability' ||
          context === 'general' ||
          context === 'course' ||
          context === 'workshops'
        ) && !!googleApiKey;


        let result;

        if (shouldUseGemini) {
          logger.info('ðŸš€ [SofLIA] Usando Google Gemini', { context, model: process.env.GEMINI_MODEL });
          result = await callGemini(message, contextPrompt, conversationHistory, userId, isSystemMessage);
        } else {
          // Fallback a OpenAI (o uso normal para otros contextos)
          result = await callOpenAI(message, contextPrompt, conversationHistory, hasCourseContext, userId, isSystemMessage, effectiveLanguage, context);
        }
        const responseTime = Date.now() - startTime;
        // Filtrar prompt del sistema y limpiar markdown
        response = sanitizeAssistantResponse(result.response);
        responseMetadata = result.metadata ? { ...result.metadata, responseTimeMs: responseTime } : { responseTimeMs: responseTime };
        logger.info('âœ… OpenAI respondiÃ³ exitosamente', { responseLength: response.length, responseTime });
      } catch (error) {
        logger.error('âŒ Error con OpenAI, usando fallback:', error);
        logger.error('OpenAI error details:', {
          errorMessage: error instanceof Error ? error.message : String(error),
          hasApiKey: !!openaiApiKey,
          apiKeyPrefix: openaiApiKey ? openaiApiKey.substring(0, 10) + '...' : 'none'
        });
        // FORZAR ESPAÃ‘OL para study-planner siempre
        const effectiveLanguage = (context === 'study-planner' || context === 'study-planner-availability') ? 'es' : language;
        const fallbackResponse = generateAIResponse(message, context, limitedHistory, contextPrompt, effectiveLanguage);
        response = sanitizeAssistantResponse(fallbackResponse);
      }
    } else {
      // Usar respuestas predeterminadas si no hay API key
      logger.warn('âš ï¸ No hay OPENAI_API_KEY configurada, usando fallback');
      // FORZAR ESPAÃ‘OL para study-planner siempre
      const effectiveLanguage = (context === 'study-planner' || context === 'study-planner-availability') ? 'es' : language;
      const fallbackResponse = generateAIResponse(message, context, limitedHistory, contextPrompt, effectiveLanguage);
      response = sanitizeAssistantResponse(fallbackResponse);
    }

    // âœ… OPTIMIZACIÃ“N: Obtener analytics de forma asÃ­ncrona y registrar mensajes
    // No bloquear la respuesta esperando analytics
    analyticsPromise.then(async ({ liaLogger, conversationId: analyticsConversationId }) => {
      if (!liaLogger || !analyticsConversationId || isSystemMessage) {
        logger.info('[LIA Analytics] Skipping analytics:', {
          hasLogger: !!liaLogger,
          hasConversationId: !!analyticsConversationId,
          isSystemMessage
        });
        return;
      }

      try {
        logger.info('[LIA Analytics] Registrando mensajes...', { conversationId: analyticsConversationId });

        // Registrar mensaje del usuario CON tokens de entrada y costo
        await liaLogger.logMessage(
          'user',
          message,
          false,
          responseMetadata ? {
            tokensUsed: responseMetadata.promptTokens,
            costUsd: responseMetadata.promptCostUsd,
            modelUsed: responseMetadata.modelUsed
          } : undefined
        );

        // Registrar respuesta del asistente CON tokens de salida y costo
        await liaLogger.logMessage(
          'assistant',
          response,
          false,
          responseMetadata ? {
            tokensUsed: responseMetadata.completionTokens,
            costUsd: responseMetadata.completionCostUsd,
            modelUsed: responseMetadata.modelUsed,
            responseTimeMs: responseMetadata.responseTimeMs
          } : undefined
        );

        logger.info('[LIA Analytics] âœ… Mensajes registrados exitosamente', {
          conversationId: analyticsConversationId,
          promptTokens: responseMetadata?.promptTokens,
          completionTokens: responseMetadata?.completionTokens,
          totalTokens: responseMetadata?.tokensUsed,
          promptCostUsd: responseMetadata?.promptCostUsd,
          completionCostUsd: responseMetadata?.completionCostUsd,
          totalCostUsd: responseMetadata?.costUsd
        });

        // Actualizar conversationId si se creÃ³ una nueva
        if (analyticsConversationId && !existingConversationId) {
          conversationId = analyticsConversationId;
        }
      } catch (error) {
        logger.error('âŒ Error registrando analytics (async):', {
          error: error instanceof Error ? error.message : error,
          conversationId: analyticsConversationId,
          userId: user?.id
        });
      }
    }).catch((error) => {
      logger.error('âŒ Error en promesa de analytics:', error);
    });

    // Guardar la conversaciÃ³n en la base de datos (opcional)
    // Solo guardar si el usuario estÃ¡ autenticado
    // Nota: La tabla ai_chat_history puede no estar en los tipos generados
    if (user) {
      try {
        const { error: dbError } = await supabase
          .from('ai_chat_history' as any)
          .insert({
            user_id: user.id,
            context: context,
            user_message: message,
            assistant_response: response,
            lesson_id: courseContext?.lessonTitle ? courseContext.lessonTitle.substring(0, 100) : null,
            created_at: new Date().toISOString()
          } as any);

        if (dbError) {
          logger.error('Error guardando historial de chat:', dbError);
        }
      } catch (dbError) {
        logger.error('Error guardando historial:', dbError);
      }
    }

    // âœ… OPTIMIZACIÃ“N: Obtener conversationId de analytics si estÃ¡ disponible (sin bloquear)
    // Si hay un conversationId existente, usarlo; si no, intentar obtenerlo de la promesa rÃ¡pidamente
    let finalConversationId = conversationId;

    // Intentar obtener conversationId de analytics si se completÃ³ rÃ¡pidamente (timeout de 100ms)
    try {
      const analyticsResult = await Promise.race([
        analyticsPromise,
        new Promise<{ liaLogger: SofLIALogger | null; conversationId: string | null }>((resolve) =>
          setTimeout(() => resolve({ liaLogger: null, conversationId: null }), 100)
        )
      ]);

      if (analyticsResult.conversationId && !finalConversationId) {
        finalConversationId = analyticsResult.conversationId;
      }
    } catch (error) {
      // Ignorar errores, usar conversationId existente
    }

    return NextResponse.json({
      response,
      conversationId: finalConversationId || undefined // Devolver conversationId para el frontend
    });
  } catch (error) {
    logger.error('Error en API de chat:', error);

    // Proporcionar informaciÃ³n mÃ¡s detallada del error
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    const errorDetails = error instanceof Error && 'cause' in error ? error.cause : undefined;

    logger.error('Detalles del error:', {
      message: errorMessage,
      details: errorDetails,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    );
  }
}
