import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { logger } from '../../../lib/utils/logger';
import { createClient } from '../../../lib/supabase/server';
import type { CourseLessonContext } from '../../../core/types/lia.types';
import { checkRateLimit } from '../../../core/lib/rate-limit';
import { calculateCost, logOpenAIUsage } from '../../../lib/openai/usage-monitor';
import type { Database } from '../../../lib/supabase/types';
import { SessionService } from '../../../features/auth/services/session.service';
import { SofLIALogger, type ContextType } from '../../../lib/analytics/lia-logger';
import { SofLIAContextService } from '../../../features/study-planner/services/lia-context.service';
import { SofLIAPersonalizationService } from '../../../core/services/lia-personalization.service';
import { getContextPrompt, type PageContext, type SupportedLanguage } from './system-prompt.service';
import { callOpenAI, callGemini, generateAIResponse } from './ai-provider.service';

// Tipo para el contexto de la página
interface PageContext {
  pathname: string;
  detectedArea: string;
  description: string;
  // Contenido real extraído del DOM
  pageTitle?: string;
  metaDescription?: string;
  headings?: string[];
  mainText?: string;
  // Contexto de la plataforma completa
  platformContext?: string;
  // Links disponibles según el rol del usuario
  availableLinks?: string;
  // Contexto del usuario (para study-planner y otros contextos específicos)
  userContext?: {
    userType?: string;
    rol?: string;
    area?: string;
    nivel?: string;
    tamanoEmpresa?: string;
    organizationName?: string;
    isB2B?: boolean;
    calendarConnected?: boolean;
    calendarProvider?: string | null;
    hasCalendarAnalyzed?: boolean;
    hasRecommendedSchedules?: boolean;
    [key: string]: any; // Permitir propiedades adicionales
  } | null;
}

const SUPPORTED_LANGUAGES = ['es', 'en', 'pt'] as const;
type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

const normalizeLanguage = (lang?: string): SupportedLanguage => {
  if (!lang) return 'es';
  const lower = lang.toLowerCase();
  return SUPPORTED_LANGUAGES.includes(lower as SupportedLanguage) ? (lower as SupportedLanguage) : 'es';
};

/**
 * Genera instrucciones específicas de ayuda basadas en el tipo de dificultad detectada
 */
const generateHelpInstructions = (helpType: string, context: any): string => {
  const currentActivity = context?.activitiesContext?.currentActivityFocus;
  const userRole = context?.userRole;

  const instructions: Record<string, string> = {
    'activity_guidance': `
El estudiante está trabajando en una actividad específica pero está inactivo.
${currentActivity ? `
ACTIVIDAD EN FOCO: "${currentActivity.title}"
- Tipo: ${currentActivity.type}
- Obligatoria: ${currentActivity.isRequired ? 'Sí' : 'No'}
- Descripción: ${currentActivity.description}

ESTRATEGIA DE AYUDA:
1. Reconoce el esfuerzo y la dificultad que puede presentar esta actividad
2. NO des la respuesta directa, pero sí proporciona:
   - Una pista sobre QUÉ buscar en el contenido de la lección
   - Una pregunta guía que le ayude a reflexionar
   - Un ejemplo similar (pero no idéntico) si es apropiado
3. Sugiere revisar secciones específicas de la lección que podrían ayudar
4. Motiva al estudiante a intentarlo de nuevo con las pistas proporcionadas
${userRole ? `5. Adapta el ejemplo al contexto de "${userRole}"` : ''}
` : 'Ayuda al estudiante a identificar en qué actividad está trabajando y ofrece orientación general.'}`,

    'content_explanation': `
El estudiante está inactivo en la visualización de contenido (video, transcripción o resumen).
ESTRATEGIA DE AYUDA:
1. Pregunta qué parte del contenido le genera dudas
2. Ofrece un resumen ejecutivo de los puntos clave de la lección
3. Identifica conceptos que podrían ser complejos y ofrece explicaciones simples
4. Sugiere técnicas de estudio activo (tomar notas, hacer preguntas, relacionar con experiencia previa)
${userRole ? `5. Proporciona ejemplos relevantes para alguien en el rol de "${userRole}"` : ''}`,

    'content_navigation': `
El estudiante está haciendo scroll excesivo, lo que indica que busca información específica.
ESTRATEGIA DE AYUDA:
1. Pregunta directamente QUÉ está buscando
2. Proporciona un índice o mapa del contenido de la lección con timestamps/secciones
3. Identifica las secciones clave donde podría encontrar lo que busca
4. Sugiere usar Ctrl+F o la función de búsqueda si aplica`,

    'activity_hints': `
El estudiante ha fallado múltiples intentos en una actividad.
${currentActivity ? `
ACTIVIDAD CON DIFICULTADES: "${currentActivity.title}"

ESTRATEGIA DE AYUDA PROGRESIVA:
1. PRIMER NIVEL - Pista general:
   - Indica el concepto o sección de la lección que contiene la respuesta
   - Formula una pregunta guía que le ayude a pensar en la dirección correcta

2. SEGUNDO NIVEL - Pista específica (si sigue con problemas):
   - Proporciona un ejemplo paralelo que ilustre el concepto
   - Desglosa la actividad en pasos más pequeños

3. TERCER NIVEL - Casi la respuesta (solo si ya ha intentado con las pistas anteriores):
   - Da la estructura o formato de la respuesta esperada
   - Indica qué elementos debe incluir, pero sin darle el contenido exacto

4. MOTIVACIÓN CONSTANTE:
   - Refuerza que la dificultad es normal y parte del proceso de aprendizaje
   - Celebra el esfuerzo y la persistencia
${userRole ? `   - Conecta la importancia de esta actividad con su rol como "${userRole}"` : ''}
` : 'Ayuda al estudiante a identificar qué actividad está causando problemas.'}`,

    'activity_structure': `
El estudiante está escribiendo y borrando frecuentemente, lo que indica inseguridad sobre cómo estructurar su respuesta.

ESTRATEGIA DE AYUDA:
1. Proporciona una plantilla o estructura clara de cómo debería organizarse la respuesta
2. Da ejemplos del formato esperado (lista de puntos, párrafos, tabla, etc.)
3. Indica la longitud aproximada esperada
4. Sugiere un enfoque paso a paso para construir la respuesta
${currentActivity ? `5. Para la actividad "${currentActivity.title}", específicamente sugiere cómo organizar las ideas` : ''}`,

    'concept_clarification': `
El estudiante está navegando repetitivamente entre secciones, indicando confusión conceptual.

ESTRATEGIA DE AYUDA:
1. Identifica cuál podría ser el concepto central que genera confusión
2. Explica el concepto de manera simple, usando analogías cotidianas
3. Conecta cómo las diferentes partes de la lección se relacionan entre sí
4. Crea un "mapa conceptual" textual que muestre las relaciones
5. Sugiere un orden lógico para revisar el material
${userRole ? `6. Usa ejemplos del mundo "${userRole}" para ilustrar los conceptos` : ''}`,

    'interface_guidance': `
El estudiante ha hecho clicks sin resultado, indicando problemas de navegación o uso de la interfaz.

ESTRATEGIA DE AYUDA:
1. Explica cómo navegar correctamente por la plataforma de aprendizaje
2. Indica dónde encontrar las diferentes pestañas (video, transcripción, resumen, actividades)
3. Explica cómo completar y enviar actividades
4. Sugiere usar el botón de ayuda o tutoriales de la plataforma si están disponibles`,

    'general': `
El estudiante ha solicitado ayuda general o el sistema detectó dificultades no específicas.

ESTRATEGIA DE AYUDA GENERAL:
1. Haz preguntas diagnósticas abiertas:
   - "¿En qué parte de la lección sientes que necesitas más apoyo?"
   - "¿Hay algún concepto específico que no te quede claro?"
   - "¿Estás trabajando en alguna actividad en particular?"

2. Proporciona un resumen de lo que cubre la lección actual

3. Ofrece múltiples tipos de ayuda:
   - Explicación de conceptos
   - Ayuda con actividades
   - Orientación de navegación

4. Mantén un tono cálido, paciente y motivador
${userRole ? `5. Ten en cuenta que el estudiante tiene el rol de "${userRole}" al dar ejemplos` : ''}`
  };

  return instructions[helpType] || instructions['general'];
};

/**
 * Detecta el idioma del mensaje del usuario basándose en palabras clave comunes
 */
const detectMessageLanguage = (message: string): SupportedLanguage => {
  const lowerMessage = message.toLowerCase().trim();

  // Patrones específicos para inglés (más precisos)
  const englishPatterns = [
    /^(what|how|where|when|why|can|could|would|should|tell|show|give|help|i want|i need|i'm|i am|what can|what is|what are|how do|how can|how does)/i,
    /\b(the|a|an|is|are|was|were|this|that|these|those|you|your|we|they|their)\b/i,
    /\b(what|how|where|when|why|can|could|would|should|will|would|might)\b/i
  ];

  // Patrones específicos para portugués
  const portuguesePatterns = [
    /^(o que|qual|quando|onde|como|por que|você|pode|pode me|me ajuda|preciso|quero|estou|sou|o que é|qual é)/i,
    /\b(você|vocês|eu|nós|eles|elas|o|a|os|as|um|uma|uns|umas)\b/i,
    /\b(que|qual|quando|onde|como|por|para|com|sem|de|do|da|dos|das|em|no|na|nos|nas)\b/i
  ];

  // Contar coincidencias de patrones
  const englishScore = englishPatterns.reduce((score, pattern) => {
    return score + (pattern.test(lowerMessage) ? 1 : 0);
  }, 0);

  const portugueseScore = portuguesePatterns.reduce((score, pattern) => {
    return score + (pattern.test(lowerMessage) ? 1 : 0);
  }, 0);

  // Si hay patrones claros de inglés
  if (englishScore >= 2 || /^(what|how|where|when|why|can|could|would|should)/i.test(lowerMessage)) {
    return 'en';
  }

  // Si hay patrones claros de portugués
  if (portugueseScore >= 2 || /^(o que|qual|quando|onde|como|você|pode)/i.test(lowerMessage)) {
    return 'pt';
  }

  // Por defecto, español
  return 'es';
};

const LANGUAGE_CONFIG: Record<SupportedLanguage, { instruction: string; fallback: string }> = {
  es: {
    instruction: 'Responde siempre en español de manera natural, cercana y profesional. Usa un tono amigable y motivador.',
    fallback: 'Estoy aquí para ayudarte con nuestros cursos, talleres y herramientas de IA. Cuéntame qué necesitas y te guiaré paso a paso.'
  },
  en: {
    instruction: 'Always respond in English using a natural, friendly and professional tone.',
    fallback: 'I am here to help you with our courses, workshops and AI tools. Let me know what you need and I will guide you step by step.'
  },
  pt: {
    instruction: 'Responda sempre em português com um tom natural, amigável e profissional.',
    fallback: 'Estou aqui para ajudar você com nossos cursos, workshops e ferramentas de IA. Diga o que precisa e eu vou guiá-lo passo a passo.'
  }
};

/**
 * Función para limpiar Markdown de las respuestas de SofLIA
 * Elimina todos los símbolos de formato Markdown y los convierte a texto plano
 */
async function validateProposedSchedule(
  userId: string,
  proposedSlots: Array<{ date: string; startTime: string; endTime: string }>
): Promise<{ hasConflicts: boolean; conflicts: Array<{ date: string; event: string; time: string }> }> {
  try {
    // 1. Obtener eventos del calendario del usuario
    const calendarResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/study-planner/calendar/events?userId=${userId}`,
      { method: 'GET' }
    );

    if (!calendarResponse.ok) {
      console.warn('No se pudo obtener calendario para validación');
      return { hasConflicts: false, conflicts: [] };
    }

    const { events } = await calendarResponse.json();
    const conflicts: Array<{ date: string; event: string; time: string }> = [];

    // 2. Verificar cada slot propuesto contra eventos existentes
    for (const slot of proposedSlots) {
      const slotDate = new Date(slot.date);
      const [startHour, startMin] = slot.startTime.split(':').map(Number);
      const [endHour, endMin] = slot.endTime.split(':').map(Number);

      const slotStart = new Date(slotDate);
      slotStart.setHours(startHour, startMin, 0, 0);

      const slotEnd = new Date(slotDate);
      slotEnd.setHours(endHour, endMin, 0, 0);

      // Verificar conflictos con eventos
      for (const event of events) {
        const eventStart = new Date(event.start || event.startTime);
        const eventEnd = new Date(event.end || event.endTime);

        // Detectar solapamiento
        const hasOverlap = (
          (slotStart >= eventStart && slotStart < eventEnd) ||
          (slotEnd > eventStart && slotEnd <= eventEnd) ||
          (slotStart <= eventStart && slotEnd >= eventEnd)
        );

        if (hasOverlap) {
          conflicts.push({
            date: slot.date,
            event: event.title || 'Evento sin título',
            time: `${eventStart.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - ${eventEnd.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
          });
        }
      }
    }

    return {
      hasConflicts: conflicts.length > 0,
      conflicts
    };
  } catch (error) {
    console.error('Error validando horarios:', error);
    return { hasConflicts: false, conflicts: [] };
  }
}

/**
 * Detecta si el mensaje del usuario solicita un cambio de horarios
 * Retorna los horarios propuestos si los detecta
 */
function detectScheduleChangeRequest(message: string): {
  isScheduleChange: boolean;
  proposedTime?: string;
} {
  const lowerMessage = message.toLowerCase();

  // Patrones de cambio de horarios
  const patterns = [
    /cambia.*(\d{1,2})\s*(am|pm|a\.m\.|p\.m\.)/i,
    /a las (\d{1,2})\s*(am|pm|a\.m\.|p\.m\.)/i,
    /mejor.*(\d{1,2})\s*(am|pm|a\.m\.|p\.m\.)/i,
    /prefiero.*(\d{1,2})\s*(am|pm|a\.m\.|p\.m\.)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      return {
        isScheduleChange: true,
        proposedTime: `${match[1]}${match[2]}`
      };
    }
  }

  return { isScheduleChange: false };
}

/**
 * Detecta días de la semana y horarios del mensaje del usuario
 * para pre-calcular las sesiones de estudio
 */
function detectStudyScheduleConfig(message: string): {
  detected: boolean;
  studyDays: string[];
  timeSlots: string[];
} {
  const lowerMessage = message.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Quitar acentos

  // Detectar días de la semana
  const dayPatterns: Record<string, string> = {
    'lunes': 'lunes',
    'martes': 'martes',
    'miercoles': 'miércoles',
    'jueves': 'jueves',
    'viernes': 'viernes',
    'sabado': 'sábado',
    'domingo': 'domingo'
  };

  const studyDays: string[] = [];
  for (const [pattern, dayName] of Object.entries(dayPatterns)) {
    if (lowerMessage.includes(pattern)) {
      studyDays.push(dayName);
    }
  }

  // Detectar horarios (mañana, tarde, noche)
  const timeSlotPatterns: Record<string, string> = {
    'manana': 'mañana',
    'mañana': 'mañana',
    'tarde': 'tarde',
    'noche': 'noche'
  };

  const timeSlots: string[] = [];
  for (const [pattern, slotName] of Object.entries(timeSlotPatterns)) {
    if (lowerMessage.includes(pattern) && !timeSlots.includes(slotName)) {
      timeSlots.push(slotName);
    }
  }

  // Solo considerar detectado si hay al menos un día Y un horario
  const detected = studyDays.length > 0 && timeSlots.length > 0;

  return { detected, studyDays, timeSlots };
}


export async function POST(request: NextRequest) {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const googleApiKey = process.env.GOOGLE_API_KEY;

  try {
    // ✅ CORRECCIÓN 6: Rate limiting específico para OpenAI
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

    // ✅ CORRECCIÓN: Usar SessionService para obtener usuario autenticado (compatible con refresh tokens)
    const user = await SessionService.getCurrentUser();

    // Permitir acceso sin autenticación para usuarios no loggeados (sin analytics)
    if (user) {
      logger.info('Usuario autenticado en /api/ai-chat', { userId: user.id, username: user.username });
    } else {
      logger.info('Usuario no autenticado - chat sin analytics');
    }

    let requestBody;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      logger.error('❌ Error parseando el body del request:', parseError);
      return NextResponse.json(
        {
          error: 'Error al parsear el body del request',
          message: parseError instanceof Error ? parseError.message : 'Error desconocido'
        },
        { status: 400 }
      );
    }

    const {
      message,
      context = 'general',
      conversationHistory = [],
      userName,
      userInfo: userInfoFromRequest,
      courseContext,
      workshopContext, // ✅ Nuevo: contexto para talleres
      pageContext,
      isSystemMessage = false,
      conversationId: existingConversationId,
      language: languageFromRequest = 'es',
      isPromptMode = false
    }: {
      message: string;
      context?: string;
      conversationHistory?: Array<{ role: string; content: string }>;
      userName?: string;
      userInfo?: {
        display_name?: string;
        first_name?: string;
        last_name?: string;
        username?: string;
        type_rol?: string;
      };
      courseContext?: CourseLessonContext;
      workshopContext?: CourseLessonContext; // ✅ Nuevo: contexto para talleres
      pageContext?: PageContext;
      isSystemMessage?: boolean;
      conversationId?: string;
      language?: string;
      isPromptMode?: boolean;
    } = requestBody;

    // Validar que el mensaje existe y no es demasiado largo
    if (!message || typeof message !== 'string') {
      logger.error('❌ Mensaje inválido o faltante');
      return NextResponse.json(
        { error: 'El campo "message" es requerido y debe ser una cadena de texto' },
        { status: 400 }
      );
    }

    // Limitar el tamaño del mensaje para evitar payloads muy grandes
    const MAX_MESSAGE_LENGTH = 50000; // 50KB de texto
    if (message.length > MAX_MESSAGE_LENGTH) {
      logger.warn(`⚠️ Mensaje demasiado largo: ${message.length} caracteres (máximo: ${MAX_MESSAGE_LENGTH})`);
      return NextResponse.json(
        {
          error: 'El mensaje es demasiado largo',
          message: `El mensaje excede el límite de ${MAX_MESSAGE_LENGTH} caracteres`
        },
        { status: 400 }
      );
    }

    // ✅ Detectar idioma del mensaje del usuario automáticamente
    const detectedMessageLanguage = detectMessageLanguage(message);

    // ✅ Priorizar el idioma de la plataforma si está explícitamente configurado
    // Si el idioma de la plataforma es diferente de español, usarlo directamente
    // Si el mensaje está en un idioma diferente al de la plataforma, usar el idioma del mensaje
    let finalLanguage: SupportedLanguage;
    if (languageFromRequest && languageFromRequest !== 'es') {
      // Si la plataforma está en inglés o portugués, priorizar ese idioma
      finalLanguage = normalizeLanguage(languageFromRequest);
    } else if (detectedMessageLanguage !== 'es' && detectedMessageLanguage !== languageFromRequest) {
      // Si el mensaje está en un idioma diferente (inglés o portugués), usar ese idioma
      finalLanguage = detectedMessageLanguage;
    } else {
      // Por defecto, usar el idioma de la plataforma
      finalLanguage = normalizeLanguage(languageFromRequest || 'es');
    }

    const language = normalizeLanguage(finalLanguage);

    // Log para debugging (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      logger.log(`🌍 Idioma detectado del mensaje: ${detectedMessageLanguage}, idioma de plataforma: ${languageFromRequest}, usando: ${language}`);
    }

    // ✅ Validaciones básicas
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'El mensaje es requerido' },
        { status: 400 }
      );
    }

    // ✅ Límite de historial de conversación (últimos 20 mensajes)
    const MAX_HISTORY_LENGTH = 20;
    let limitedHistory = conversationHistory;
    if (Array.isArray(conversationHistory) && conversationHistory.length > MAX_HISTORY_LENGTH) {
      limitedHistory = conversationHistory.slice(-MAX_HISTORY_LENGTH);
    }

    // ✅ OPTIMIZACIÓN: Usar información del usuario del request body si está disponible, evitando consulta a BD
    let userInfo: Database['public']['Tables']['users']['Row'] | null = null;
    if (userInfoFromRequest) {
      // Usar información del frontend (más rápido, no requiere consulta a BD)
      userInfo = userInfoFromRequest as any;
    } else if (user) {
      // Fallback: consultar BD solo si no viene información del frontend
      const { data: userData } = await supabase
        .from('users')
        .select('display_name, username, first_name, last_name, profile_picture_url, type_rol')
        .eq('id', user.id)
        .single();

      if (userData) {
        userInfo = userData as Database['public']['Tables']['users']['Row'];
      }
    }

    // Obtener el mejor nombre disponible para personalización (solo primer nombre)
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

    // ✅ Detectar si es el primer mensaje de la conversación
    const isFirstMessage = !conversationHistory || conversationHistory.length === 0;

    // ✅ Si está en modo prompt, usar el contexto 'prompts'
    const effectiveContext = isPromptMode ? 'prompts' : context;

    // FORZAR ESPAÑOL para study-planner siempre
    const effectiveLanguage = (effectiveContext === 'study-planner' || effectiveContext === 'study-planner-availability') ? 'es' : language;

    // Obtener contexto detallado para el planificador de estudios
    let studyPlannerContextString = '';
    if (effectiveContext === 'study-planner' && user) {
      try {
        logger.info('📚 Construyendo contexto detallado del planificador de estudios para SofLIA', { userId: user.id });
        const studyPlannerContext = await SofLIAContextService.buildStudyPlannerContext(user.id);
        studyPlannerContextString = SofLIAContextService.formatContextForPrompt(studyPlannerContext);
        logger.info('✅ Contexto del planificador construido exitosamente', {
          coursesCount: studyPlannerContext.courses.length,
          hasModules: studyPlannerContext.courses.some(c => c.modules && c.modules.length > 0)
        });
      } catch (error) {
        logger.error('❌ Error construyendo contexto del planificador:', error);
        // Continuar sin el contexto detallado si hay error
      }
    }

    // Obtener el prompt de contexto específico con el nombre del usuario, rol, contexto de curso/taller y contexto de página
    let contextPrompt = getContextPrompt(effectiveContext, displayName, courseContext, workshopContext, pageContext, userRole, effectiveLanguage, isFirstMessage, studyPlannerContextString);

    // ✅ VALIDACIÓN DE HORARIOS: Detectar y validar solicitudes de cambio de horarios
    if (context === 'study-planner' && user) {
      const scheduleChangeRequest = detectScheduleChangeRequest(message);

      if (scheduleChangeRequest.isScheduleChange) {
        logger.info('🕐 Detectada solicitud de cambio de horarios', { proposedTime: scheduleChangeRequest.proposedTime });

        // Extraer slots propuestos del mensaje
        const proposedSlots = [{
          date: new Date().toISOString().split('T')[0],
          startTime: scheduleChangeRequest.proposedTime || '08:00',
          endTime: '09:00' // duración de 1 hora por defecto
        }];

        const validation = await validateProposedSchedule(user.id, proposedSlots);

        if (validation.hasConflicts) {
          // Agregar conflictos al contexto para que SofLIA los conozca
          contextPrompt += `\n\n⚠️ CONFLICTOS DETECTADOS:\n`;
          validation.conflicts.forEach(conflict => {
            contextPrompt += `- ${conflict.date} a las ${conflict.time}: ${conflict.event}\n`;
          });
          contextPrompt += `\n🚨 INSTRUCCIÓN IMPORTANTE: ADVIERTE al usuario sobre estos conflictos con eventos existentes.\n`;
          contextPrompt += `NO rechaces el cambio completamente. En su lugar:\n`;
          contextPrompt += `1. Muestra claramente los eventos que se solapan\n`;
          contextPrompt += `2. Pregunta si desea continuar de todos modos\n`;
          contextPrompt += `3. Sugiere horarios alternativos que estén libres\n`;

          logger.info('⚠️ Conflictos encontrados', { conflictCount: validation.conflicts.length });
        } else {
          // Sin conflictos - agregar confirmación
          contextPrompt += `\n\n✅ VALIDACIÓN: Los horarios propuestos están disponibles (sin conflictos).\n`;
          logger.info('✅ Horarios disponibles sin conflictos');
        }
      }
    }

    // ✅ NUEVO: Incluir lecciones pendientes con nombres reales en el contexto
    logger.info('🔍 [AI-CHAT] Verificando lecciones pendientes en pageContext...', {
      hasPageContext: !!pageContext,
      hasUserContext: !!pageContext?.userContext,
      hasPendingLessons: !!pageContext?.userContext?.pendingLessonsWithNames,
      pendingLessonsCount: pageContext?.userContext?.pendingLessonsWithNames?.length || 0,
    });

    if (context === 'study-planner' && pageContext?.userContext?.pendingLessonsWithNames) {
      const pendingLessons = pageContext.userContext.pendingLessonsWithNames;
      const totalPending = pageContext.userContext.totalPendingLessons || pendingLessons.length;

      if (pendingLessons.length > 0) {
        logger.info('📚 [AI-CHAT] Lecciones recibidas (primeras 3):', pendingLessons.slice(0, 3));
        contextPrompt += `\n\n📚 LECCIONES PENDIENTES DEL CURSO (${totalPending} total):\n`;
        contextPrompt += `IMPORTANTE: Usa estos nombres EXACTOS al generar el plan de estudios. NUNCA uses "Sesión 1, 2, 3...".\n\n`;

        // Agrupar por módulo
        // Agrupar por módulo
        const lessonsByModule: Record<string, Array<{ moduleTitle: string, lessonTitle: string, courseTitle: string, durationMinutes?: number }>> = {};
        pendingLessons.forEach((lesson: any) => {
          if (!lessonsByModule[lesson.moduleTitle]) {
            lessonsByModule[lesson.moduleTitle] = [];
          }
          lessonsByModule[lesson.moduleTitle].push(lesson);
        });

        Object.entries(lessonsByModule).forEach(([moduleTitle, lessons]) => {
          contextPrompt += `📁 ${moduleTitle}:\n`;
          lessons.forEach((lesson, idx) => {
            const dur = lesson.durationMinutes ? ` (${lesson.durationMinutes} min base)` : '';
            contextPrompt += `   ${idx + 1}. ${lesson.lessonTitle}${dur}\n`;
          });
          contextPrompt += `\n`;
        });

        contextPrompt += `\n⚠️ INSTRUCCIÓN: Al generar horarios, usa EXACTAMENTE los nombres de lecciones listados arriba y CALCULA LA DURACIÓN FINAL usando el multiplicador seleccionado.\n`;
        contextPrompt += `Ejemplo: Si la lección dice "(30 min base)" y el multiplicador es 1.4, el bloque dura 42 min (ej: 10:00 - 10:42).\n`;

        logger.info('📚 Lecciones pendientes agregadas al contexto', {
          totalLessons: totalPending,
          modulesCount: Object.keys(lessonsByModule).length
        });

        // ✅ PRE-CÁLCULO DE SESIONES: Detectar si el usuario proporcionó días y horarios
        const scheduleConfig = detectStudyScheduleConfig(message);

        if (scheduleConfig.detected) {
          logger.info('📅 [AI-CHAT] Días y horarios detectados:', {
            studyDays: scheduleConfig.studyDays,
            timeSlots: scheduleConfig.timeSlots
          });

          // Preparar lecciones para el pre-cálculo con índices
          const lessonsForCalculation = pendingLessons.map((lesson: any, index: number) => {
            // Intentar extraer el número de lección del título (ej: "Lección 1.1" -> 1.1)
            const lessonMatch = lesson.lessonTitle.match(/(?:Lección|Leccion)\s*(\d+(?:\.\d+)?)/i);
            let lessonOrderIndex = index + 1; // Fallback al índice secuencial

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

          // Obtener fecha límite del contexto si existe
          const targetDateStr = pageContext?.userContext?.targetDate;
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
            logger.info('✅ [AI-CHAT] Plan pre-calculado exitosamente:', {
              totalSessions: preCalculatedPlan.summary.totalSessions,
              totalWeeks: preCalculatedPlan.summary.totalWeeks,
              totalLessons: preCalculatedPlan.summary.totalLessons,
              finishDate: preCalculatedPlan.summary.finishDate
            });

            // Agregar el plan pre-calculado al contexto
            const preCalculatedPrompt = SofLIAContextService.formatPreCalculatedSessionsForPrompt(preCalculatedPlan);
            contextPrompt += preCalculatedPrompt;

            // Agregar instrucción explícita de que debe copiar este plan
            contextPrompt += `\n\n🚨 INSTRUCCIÓN CRÍTICA PARA SofLIA 🚨\n`;
            contextPrompt += `El plan de arriba ya está COMPLETAMENTE CALCULADO.\n`;
            contextPrompt += `- Las horas de fin son EXACTAS (ya calculadas con aritmética precisa)\n`;
            contextPrompt += `- Las lecciones decimales ya están AGRUPADAS correctamente\n`;
            contextPrompt += `- El número de semanas es CORRECTO\n`;
            contextPrompt += `- Los días son EXACTAMENTE los que el usuario pidió: ${scheduleConfig.studyDays.join(', ')}\n`;
            contextPrompt += `\nTU TRABAJO: Presenta este plan tal cual, con buen formato. NO recalcules NADA.\n`;
            contextPrompt += `Si modificas las horas o los días, ESTARÁS COMETIENDO UN ERROR.\n`;
          }
        }
      }
    }


    // ✅ OPTIMIZACIÓN: Inicializar analytics de forma asíncrona para no bloquear el procesamiento del mensaje
    let conversationId: string | null = existingConversationId || null;

    // Función para inicializar analytics de forma asíncrona (no bloquea la respuesta)
    const initializeAnalyticsAsync = async (): Promise<{ liaLogger: SofLIALogger | null; conversationId: string | null }> => {
      if (!user) {
        logger.warn('[LIA Analytics] ⚠️ No hay usuario autenticado, skipping analytics');
        return { liaLogger: null, conversationId: null };
      }

      logger.info('[LIA Analytics] 🚀 Iniciando analytics para usuario:', { userId: user.id, hasExistingConversation: !!conversationId });

      try {
        const liaLogger = new SofLIALogger(user.id);

        // Si no hay conversationId existente, iniciar nueva conversación
        if (!conversationId) {
          logger.info('Iniciando nueva conversación SofLIA (async)', { userId: user.id, context });

          // Truncar browser para que no exceda el límite de 100 caracteres
          const userAgent = request.headers.get('user-agent') || undefined;
          const truncatedBrowser = userAgent ? userAgent.substring(0, 100) : undefined;

          // Obtener IP del usuario (solo la primera si hay múltiples)
          const forwardedFor = request.headers.get('x-forwarded-for');
          const realIp = request.headers.get('x-real-ip');
          let clientIp: string | undefined;

          if (forwardedFor) {
            // X-Forwarded-For puede tener múltiples IPs separadas por coma
            // Tomamos solo la primera (IP del cliente real)
            clientIp = forwardedFor.split(',')[0].trim();
          } else if (realIp) {
            clientIp = realIp.trim();
          }

          // ✅ ENRIQUECIMIENTO DE DATOS: Intentar completar IDs faltantes para analíticas
          if (courseContext && context === 'course') {
            try {
              const supabase = await createClient();

              // 1. Buscar Module ID si falta
              if (!courseContext.moduleId && courseContext.moduleTitle && courseContext.courseId) {
                const { data: moduleData } = await supabase
                  .from('course_modules')
                  .select('module_id')
                  .eq('course_id', courseContext.courseId)
                  .ilike('title', courseContext.moduleTitle)
                  .limit(1)
                  .single();
                
                if (moduleData) {
                  courseContext.moduleId = moduleData.module_id;
                }
              }

              // 2. Buscar Lesson ID si falta (requiere module_id)
              if (!courseContext.lessonId && courseContext.lessonTitle && courseContext.moduleId) {
                const { data: lessonData } = await supabase
                  .from('course_lessons')
                  .select('lesson_id')
                  .eq('module_id', courseContext.moduleId)
                  .ilike('title', courseContext.lessonTitle)
                  .limit(1)
                  .single();

                if (lessonData) {
                  courseContext.lessonId = lessonData.lesson_id;
                }
              }
            } catch (lookupError) {
              // No bloquear el chat si falla la búsqueda de IDs, solo loguear warning
              logger.warn('[Analytics Enrichment] Falló la búsqueda de IDs detallados:', lookupError);
            }
          }

          const newConversationId = await liaLogger.startConversation({
            contextType: context as ContextType,
            courseContext: courseContext,
            deviceType: request.headers.get('sec-ch-ua-platform') || undefined,
            browser: truncatedBrowser,
            ipAddress: clientIp
          });

          // Si hay courseContext y se creó una nueva conversación, intentar actualizar el course_id
          if (courseContext && context === 'course' && newConversationId) {
            try {
              const supabase = await createClient();
              let courseIdToUpdate: string | null = null;

              // Intentar obtener course_id del courseContext primero (más directo)
              if (courseContext.courseId) {
                courseIdToUpdate = courseContext.courseId;
              } else if (courseContext.courseSlug) {
                // Si no hay course_id pero hay courseSlug, buscarlo en la BD
                const { data: courseData } = await supabase
                  .from('courses')
                  .select('id')
                  .eq('slug', courseContext.courseSlug)
                  .single();

                if (courseData?.id) {
                  courseIdToUpdate = courseData.id;
                }
              }

              // Actualizar la conversación con el course_id si lo encontramos
              if (courseIdToUpdate) {
                await supabase
                  .from('lia_conversations')
                  .update({ course_id: courseIdToUpdate })
                  .eq('conversation_id', newConversationId);

                logger.info('✅ Actualizado course_id en conversación', {
                  conversationId: newConversationId,
                  courseId: courseIdToUpdate
                });
              }
            } catch (error) {
              // Ignorar errores al actualizar course_id, no es crítico
              logger.warn('No se pudo actualizar course_id en conversación:', error);
            }
          }

          logger.info('✅ Nueva conversación SofLIA creada exitosamente (async)', { conversationId: newConversationId, userId: user.id, context });
          return { liaLogger, conversationId: newConversationId };
        } else {
          // Si hay conversationId existente, establecerlo en el logger
          logger.info('Continuando conversación SofLIA existente (async)', { conversationId, userId: user.id });
          liaLogger.setConversationId(conversationId);
          // ✅ Recuperar la secuencia de mensajes para continuar correctamente
          await liaLogger.recoverMessageSequence();
          return { liaLogger, conversationId };
        }
      } catch (error) {
        logger.error('❌ Error inicializando SofLIA Analytics (async):', error);
        // Continuar sin analytics si hay error
        return { liaLogger: null, conversationId: null };
      }
    };

    // Iniciar inicialización de analytics en background (no esperar)
    const analyticsPromise = initializeAnalyticsAsync();

    // ✅ Cargar configuración de personalización de SofLIA
    let personalizationPrompt = '';
    if (user) {
      try {
        const personalizationSettings = await SofLIAPersonalizationService.getSettings(user.id);
        if (personalizationSettings) {
          personalizationPrompt = SofLIAPersonalizationService.buildPersonalizationPrompt(personalizationSettings);
          // Agregar la personalización al contextPrompt
          contextPrompt += personalizationPrompt;
          logger.info('✅ Personalización de SofLIA aplicada', {
            userId: user.id,
            baseStyle: personalizationSettings.base_style,
            hasCustomInstructions: !!personalizationSettings.custom_instructions,
          });
        }
      } catch (error) {
        // No fallar si hay error cargando personalización, solo loguear
        logger.warn('⚠️ Error cargando personalización de SofLIA:', error);
      }
    }

    // Intentar usar OpenAI si está disponible
    const openaiApiKey = process.env.OPENAI_API_KEY;
    let response: string;
    const hasCourseContext = context === 'course' && courseContext !== undefined;
    const userId = user?.id || null; // Obtener userId para registro de uso

    let responseMetadata: { tokensUsed?: number; promptTokens?: number; completionTokens?: number; costUsd?: number; promptCostUsd?: number; completionCostUsd?: number; modelUsed?: string; responseTimeMs?: number } | undefined;

    if (openaiApiKey) {
      try {
        const startTime = Date.now();
        if (context === 'study-planner' || context === 'study-planner-availability') {
          logger.info('📋 [STUDY_PLANNER] Mensaje enviado a OpenAI (FULL):', message);
        }
        logger.info('🔥 Llamando a OpenAI', { message: message.substring(0, 50), hasKey: !!openaiApiKey });
        // ✅ OPTIMIZACIÓN: Pasar contexto a callOpenAI para optimizaciones específicas
        // FORZAR ESPAÑOL para study-planner siempre
        const effectiveLanguage = (context === 'study-planner' || context === 'study-planner-availability') ? 'es' : language;

        // SWITCH DE MODELOS: Usar Gemini para Study Planner y contextos generales/cursos si está configurado
        const shouldUseGemini = (
          context === 'study-planner' || 
          context === 'study-planner-availability' ||
          context === 'general' ||
          context === 'course' ||
          context === 'workshops'
        ) && !!googleApiKey;


        let result;

        if (shouldUseGemini) {
          logger.info('🚀 [SofLIA] Usando Google Gemini', { context, model: process.env.GEMINI_MODEL });
          result = await callGemini(message, contextPrompt, conversationHistory, userId, isSystemMessage);
        } else {
          // Fallback a OpenAI (o uso normal para otros contextos)
          result = await callOpenAI(message, contextPrompt, conversationHistory, hasCourseContext, userId, isSystemMessage, effectiveLanguage, context);
        }
        const responseTime = Date.now() - startTime;
        // Filtrar prompt del sistema y limpiar markdown
        response = filterSystemPromptFromResponse(result.response);
        response = cleanMarkdownFromResponse(response);
        responseMetadata = result.metadata ? { ...result.metadata, responseTimeMs: responseTime } : { responseTimeMs: responseTime };
        logger.info('✅ OpenAI respondió exitosamente', { responseLength: response.length, responseTime });
      } catch (error) {
        logger.error('❌ Error con OpenAI, usando fallback:', error);
        logger.error('OpenAI error details:', {
          errorMessage: error instanceof Error ? error.message : String(error),
          hasApiKey: !!openaiApiKey,
          apiKeyPrefix: openaiApiKey ? openaiApiKey.substring(0, 10) + '...' : 'none'
        });
        // FORZAR ESPAÑOL para study-planner siempre
        const effectiveLanguage = (context === 'study-planner' || context === 'study-planner-availability') ? 'es' : language;
        const fallbackResponse = generateAIResponse(message, context, limitedHistory, contextPrompt, effectiveLanguage);
        response = filterSystemPromptFromResponse(fallbackResponse);
        response = cleanMarkdownFromResponse(response);
      }
    } else {
      // Usar respuestas predeterminadas si no hay API key
      logger.warn('⚠️ No hay OPENAI_API_KEY configurada, usando fallback');
      // FORZAR ESPAÑOL para study-planner siempre
      const effectiveLanguage = (context === 'study-planner' || context === 'study-planner-availability') ? 'es' : language;
      const fallbackResponse = generateAIResponse(message, context, limitedHistory, contextPrompt, effectiveLanguage);
      response = filterSystemPromptFromResponse(fallbackResponse);
      response = cleanMarkdownFromResponse(response);
    }

    // ✅ OPTIMIZACIÓN: Obtener analytics de forma asíncrona y registrar mensajes
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

        logger.info('[LIA Analytics] ✅ Mensajes registrados exitosamente', {
          conversationId: analyticsConversationId,
          promptTokens: responseMetadata?.promptTokens,
          completionTokens: responseMetadata?.completionTokens,
          totalTokens: responseMetadata?.tokensUsed,
          promptCostUsd: responseMetadata?.promptCostUsd,
          completionCostUsd: responseMetadata?.completionCostUsd,
          totalCostUsd: responseMetadata?.costUsd
        });

        // Actualizar conversationId si se creó una nueva
        if (analyticsConversationId && !existingConversationId) {
          conversationId = analyticsConversationId;
        }
      } catch (error) {
        logger.error('❌ Error registrando analytics (async):', {
          error: error instanceof Error ? error.message : error,
          conversationId: analyticsConversationId,
          userId: user?.id
        });
      }
    }).catch((error) => {
      logger.error('❌ Error en promesa de analytics:', error);
    });

    // Guardar la conversación en la base de datos (opcional)
    // Solo guardar si el usuario está autenticado
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

    // ✅ OPTIMIZACIÓN: Obtener conversationId de analytics si está disponible (sin bloquear)
    // Si hay un conversationId existente, usarlo; si no, intentar obtenerlo de la promesa rápidamente
    let finalConversationId = conversationId;

    // Intentar obtener conversationId de analytics si se completó rápidamente (timeout de 100ms)
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

    // Proporcionar información más detallada del error
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
