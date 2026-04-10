/**
 * API Endpoint: Save Study Plan
 * 
 * POST /api/study-planner/save-plan
 * 
 * Guarda un plan de estudio generado en la base de datos
 * junto con todas sus sesiones.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { SessionService } from '../../../../features/auth/services/session.service';
import { UserContextService } from '../../../../features/study-planner/services/user-context.service';
import type { 
  StudyPlanConfig,
  StudySession,
} from '../../../../features/study-planner/types/user-context.types';
import {
  buildPlannedCourseKey,
  getUserPlannedCourseKeys,
} from '@/features/study-planner/services/study-planner-plans.server.service';

// Función helper para crear cliente con service role key (bypass RLS)
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurada');
  }

  return createServiceClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

interface SavePlanRequest {
  config: StudyPlanConfig;
  sessions: StudySession[];
}

interface SavePlanResponse {
  success: boolean;
  data?: {
    planId: string;
    sessionsCreated: number;
    sessionIds?: string[]; // IDs de las sesiones creadas para sincronización con calendario
    sessions?: Array<{
      id: string;
      clientReferenceId?: string;
      startTime?: string;
      endTime?: string;
    }>;
  };
  error?: string;
}

interface SessionMetricsPayload {
  clientReferenceId?: string;
  generationSource?: 'ai_generated' | 'manual';
  plannedCourseId?: string | null;
  plannedLessonIds?: string[];
  plannedLessonTitles?: string[];
  plannedLessons?: Array<{
    courseId?: string;
    courseTitle: string;
    lessonId?: string;
    lessonTitle: string;
    lessonOrderIndex: number;
    durationMinutes: number;
    moduleTitle?: string;
    moduleOrderIndex?: number;
  }>;
}

export async function POST(request: NextRequest): Promise<NextResponse<SavePlanResponse>> {
  try {
    // Verificar autenticación
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }
    
    const body: SavePlanRequest = await request.json();
    
    // Validar datos requeridos
    if (!body.config || !body.sessions) {
      return NextResponse.json(
        { success: false, error: 'Configuración y sesiones son requeridas' },
        { status: 400 }
      );
    }
    
    // Validar campos requeridos del config
    if (!body.config.name || !body.config.timezone || !body.config.preferredDays || body.config.preferredDays.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Faltan campos requeridos: name, timezone o preferredDays' 
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.config.courseIds) || body.config.courseIds.length !== 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Debes crear un plan para exactamente un curso a la vez',
        },
        { status: 400 }
      );
    }
    
    // Validar que haya al menos una sesión
    if (!body.sessions || body.sessions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Debe haber al menos una sesión' },
        { status: 400 }
      );
    }
    
    // Usar cliente admin para bypass de RLS
    const supabase = createAdminClient();

    // ✅ Detectar tipo de usuario y organization_id ANTES de validar duplicados,
    // para poder usar la clave compuesta (courseId::orgId) en la verificación.
    let userType = body.config.userType;
    let organizationId: string | null = null;

    if (!userType) {
      userType = await UserContextService.getUserType(user.id);
    }

    if (userType === 'b2b') {
      // Primary source: users.organization_id (single-org fast path)
      const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (userData?.organization_id) {
        organizationId = userData.organization_id;
      } else {
        // Fallback: organization_users table (handles users where users.organization_id is null)
        const { data: orgUserData } = await supabase
          .from('organization_users')
          .select('organization_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .limit(1)
          .maybeSingle();

        if (orgUserData?.organization_id) {
          organizationId = orgUserData.organization_id;
        }
      }
    }

    // Validar duplicados usando clave compuesta (courseId::orgId).
    // Permite planificar el mismo curso en dos organizaciones distintas.
    const plannedCourseKeys = await getUserPlannedCourseKeys(user.id);
    const duplicateCourseId = body.config.courseIds.find((courseId) =>
      plannedCourseKeys.has(buildPlannedCourseKey(courseId, organizationId)),
    );

    if (duplicateCourseId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ya existe un plan activo para este curso. Selecciona otro curso o modifica el plan existente.',
        },
        { status: 409 }
      );
    }
    
    // Convertir fechas ISO a formato date (YYYY-MM-DD)
    const formatDateOnly = (isoDate: string | undefined): string | null => {
      if (!isoDate) return null;
      const date = new Date(isoDate);
      return date.toISOString().split('T')[0];
    };
    
    // Iniciar transacción creando el plan
    const { data: plan, error: planError } = await supabase
      .from('study_plans')
      .insert({
        user_id: user.id,
        name: body.config.name,
        description: body.config.description,
        goal_hours_per_week: body.config.goalHoursPerWeek,
        start_date: formatDateOnly(body.config.startDate),
        end_date: formatDateOnly(body.config.endDate),
        timezone: body.config.timezone,
        preferred_days: body.config.preferredDays,
        preferred_time_blocks: body.config.preferredTimeBlocks,
        generation_mode: body.config.generationMode,
        preferred_session_type: body.config.preferredSessionType,
        learning_route_id: body.config.learningRouteId,
        // ✅ Guardar user_type directamente en la tabla
        user_type: userType,
        // ✅ Guardar organization_id si el usuario es B2B
        organization_id: organizationId,
        // También guardar en metadata para compatibilidad
        ai_generation_metadata: {
          userType: userType,
          courseIds: body.config.courseIds,
          minSessionMinutes: body.config.minSessionMinutes,
          maxSessionMinutes: body.config.maxSessionMinutes,
          breakDurationMinutes: body.config.breakDurationMinutes,
          calendarAnalyzed: body.config.calendarAnalyzed,
          calendarProvider: body.config.calendarProvider,
          sofLiaAvailabilityAnalysis: body.config.sofLiaAvailabilityAnalysis,
          sofLiaTimeAnalysis: body.config.sofLiaTimeAnalysis,
          generatedAt: new Date().toISOString(),
        },
      })
      .select('id')
      .single();
    
    if (planError) {
      console.error('Error creando plan:', planError);
      console.error('Datos del plan:', {
        user_id: user.id,
        name: body.config.name,
        goal_hours_per_week: body.config.goalHoursPerWeek,
        preferred_days: body.config.preferredDays,
        preferred_time_blocks: body.config.preferredTimeBlocks,
      });
      return NextResponse.json(
        { 
          success: false, 
          error: `Error al crear el plan de estudio: ${planError.message || JSON.stringify(planError)}` 
        },
        { status: 500 }
      );
    }
    
    // Validar que haya sesiones válidas después del filtrado del cliente
    if (!body.sessions || body.sessions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No hay sesiones válidas para guardar. Por favor, verifica que todas las sesiones tengan título, hora de inicio y hora de fin.' },
        { status: 400 }
      );
    }
    
    // Crear sesiones (validar y limpiar datos)
    const sessionsToInsert: Record<string, unknown>[] = [];
    const invalidSessions: Array<{ index: number; reason: string }> = [];
    
    for (let index = 0; index < body.sessions.length; index++) {
      const session = body.sessions[index];
      
      // Validar campos requeridos con mensajes específicos
      const missingFields: string[] = [];
      if (!session.title || typeof session.title !== 'string' || session.title.trim() === '') {
        missingFields.push('title');
      }
      if (!session.startTime || typeof session.startTime !== 'string') {
        missingFields.push('startTime');
      }
      if (!session.endTime || typeof session.endTime !== 'string') {
        missingFields.push('endTime');
      }
      
      if (missingFields.length > 0) {
        invalidSessions.push({
          index: index + 1,
          reason: `Campos requeridos faltantes: ${missingFields.join(', ')}`
        });
        continue;
      }
      
      // Validar formato de fechas
      let startDate: Date;
      let endDate: Date;
      
      try {
        startDate = new Date(session.startTime);
        endDate = new Date(session.endTime);
        
        if (isNaN(startDate.getTime())) {
          invalidSessions.push({
            index: index + 1,
            reason: `startTime inválido: ${session.startTime}`
          });
          continue;
        }
        
        if (isNaN(endDate.getTime())) {
          invalidSessions.push({
            index: index + 1,
            reason: `endTime inválido: ${session.endTime}`
          });
          continue;
        }
        
        // Validar que endTime sea después de startTime
        if (endDate.getTime() <= startDate.getTime()) {
          invalidSessions.push({
            index: index + 1,
            reason: `endTime debe ser posterior a startTime`
          });
          continue;
        }
      } catch (dateError) {
        invalidSessions.push({
          index: index + 1,
          reason: `Error parseando fechas: ${dateError instanceof Error ? dateError.message : 'Error desconocido'}`
        });
        continue;
      }
      
      // NOTA: duration_minutes tiene un DEFAULT calculado en la BD que usa end_time - start_time
      // No debemos incluir duration_minutes en el INSERT para que PostgreSQL lo calcule automáticamente
      sessionsToInsert.push({
        organization_id: organizationId,
        plan_id: plan.id,
        user_id: user.id,
        title: session.title.substring(0, 500), // Limitar longitud
        description: session.description ? session.description.substring(0, 2000) : null,
        course_id: session.courseId || null,
        lesson_id: session.lessonId || null,
        start_time: session.startTime,
        end_time: session.endTime,
        // duration_minutes se calcula automáticamente por el DEFAULT de la tabla
        status: 'planned',
        is_ai_generated: session.isAiGenerated !== undefined ? session.isAiGenerated : true,
        session_type: session.sessionType || 'medium',
        metrics: {
          generationSource:
            session.isAiGenerated !== false ? 'ai_generated' : 'manual',
          clientReferenceId:
            typeof (session as { clientReferenceId?: string }).clientReferenceId === 'string'
              ? (session as { clientReferenceId?: string }).clientReferenceId
              : undefined,
          plannedCourseId: session.courseId || null,
          plannedLessonIds: Array.isArray(session.plannedLessons)
            ? session.plannedLessons
                .map((lesson) => lesson.lessonId)
                .filter((lessonId): lessonId is string => typeof lessonId === 'string' && lessonId.trim() !== '')
            : undefined,
          plannedLessonTitles: Array.isArray(session.plannedLessons)
            ? session.plannedLessons
                .map((lesson) => lesson.lessonTitle?.trim())
                .filter((lessonTitle): lessonTitle is string => typeof lessonTitle === 'string' && lessonTitle !== '')
            : undefined,
          plannedLessons: Array.isArray(session.plannedLessons)
            ? session.plannedLessons
            : undefined,
        } satisfies SessionMetricsPayload,
      });
    }
    
    // Si hay sesiones inválidas, retornar error con detalles
    if (invalidSessions.length > 0) {
      const errorDetails = invalidSessions.map(s => `Sesión ${s.index}: ${s.reason}`).join('; ');
      console.error('❌ Sesiones inválidas detectadas:', invalidSessions);
      return NextResponse.json(
        { 
          success: false, 
          error: `Se encontraron ${invalidSessions.length} sesión(es) inválida(s). ${errorDetails}` 
        },
        { status: 400 }
      );
    }
    
    // Validar que haya al menos una sesión válida después del filtrado
    if (sessionsToInsert.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No hay sesiones válidas para guardar después de la validación.' },
        { status: 400 }
      );
    }
    
    const { data: createdSessions, error: sessionsError } = await supabase
      .from('study_sessions')
      .insert(sessionsToInsert)
      .select('id, start_time, end_time, metrics');
    
    if (sessionsError) {
      console.error('Error creando sesiones:', sessionsError);
      console.error('Primeras 3 sesiones:', sessionsToInsert.slice(0, 3));
      // Intentar eliminar el plan si falla la creación de sesiones
      await supabase.from('study_plans').delete().eq('id', plan.id);
      return NextResponse.json(
        { 
          success: false, 
          error: `Error al crear las sesiones del plan: ${sessionsError.message || JSON.stringify(sessionsError)}` 
        },
        { status: 500 }
      );
    }
    
    // Actualizar preferencias del usuario (solo campos que existen en la tabla)
    await supabase
      .from('study_preferences')
      .upsert({
        user_id: user.id,
        timezone: body.config.timezone,
        preferred_time_of_day: getTimeOfDay(body.config.preferredTimeBlocks),
        preferred_days: body.config.preferredDays,
        daily_target_minutes: Math.round((body.config.goalHoursPerWeek * 60) / (body.config.preferredDays.length || 5)),
        weekly_target_minutes: body.config.goalHoursPerWeek * 60,
        preferred_session_type: body.config.preferredSessionType,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });
    
    return NextResponse.json({
      success: true,
      data: {
        planId: plan.id,
        sessionsCreated: createdSessions?.length || 0,
        sessionIds: createdSessions?.map(s => s.id) || [],
        sessions: createdSessions?.map((session) => ({
          id: session.id,
          clientReferenceId:
            typeof (session.metrics as SessionMetricsPayload | null)?.clientReferenceId === 'string'
              ? (session.metrics as SessionMetricsPayload).clientReferenceId
              : undefined,
          startTime: session.start_time,
          endTime: session.end_time,
        })) || [],
      },
    });
    
  } catch (error) {
    console.error('Error guardando plan de estudio:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}

/**
 * Determina el momento del día preferido basándose en los bloques de tiempo
 */
function getTimeOfDay(timeBlocks: Array<{ startHour: number; startMinute?: number; endHour: number; endMinute?: number }>): string {
  if (!timeBlocks || timeBlocks.length === 0) return 'morning';
  
  let morningCount = 0;
  let afternoonCount = 0;
  let eveningCount = 0;
  let nightCount = 0;
  
  for (const block of timeBlocks) {
    // Calcular hora promedio considerando minutos si están disponibles
    const startTotalMinutes = block.startHour * 60 + (block.startMinute || 0);
    const endTotalMinutes = block.endHour * 60 + (block.endMinute || 0);
    const avgHour = (startTotalMinutes + endTotalMinutes) / 2 / 60;
    
    if (avgHour >= 5 && avgHour < 12) {
      morningCount++;
    } else if (avgHour >= 12 && avgHour < 17) {
      afternoonCount++;
    } else if (avgHour >= 17 && avgHour < 21) {
      eveningCount++;
    } else {
      nightCount++;
    }
  }
  
  const max = Math.max(morningCount, afternoonCount, eveningCount, nightCount);
  
  if (max === morningCount) return 'morning';
  if (max === afternoonCount) return 'afternoon';
  if (max === eveningCount) return 'evening';
  return 'night';
}
