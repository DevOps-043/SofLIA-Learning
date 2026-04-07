/**
 * API Endpoint: Get Active Study Plan for Dashboard
 * 
 * GET /api/study-planner/dashboard/plan
 * 
 * Obtiene el plan de estudios activo del usuario con sus sesiones.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '../../../../../features/auth/services/session.service';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import type { Database } from '../../../../../lib/supabase/types';
import { logger } from '../../../../../lib/utils/logger';
import { createAdminClient as createSharedAdminClient } from '@/lib/supabase/admin';

/**
 * Crea un cliente de Supabase con Service Role Key para bypass de RLS
 */
export function createLegacyAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurada.');
  }

  return createServiceClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

interface DashboardPlanResponse {
  success: boolean;
  data?: {
    id: string;
    name: string;
    description?: string;
    startDate: string;
    endDate?: string;
    timezone: string;
    preferredDays: number[];
    sessions: Array<{
      id: string;
      planId: string;
      title: string;
      description?: string;
      courseId?: string;
      lessonId?: string;
      startTime: string;
      endTime: string;
      durationMinutes: number;
      status: string;
      isAiGenerated: boolean;
    }>;
    totalSessions: number;
    completedSessions: number;
    upcomingSessions: number;
    calendarConnected: boolean;
    calendarProvider?: string;
    lastCalendarSync?: string;
  };
  error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<DashboardPlanResponse>> {
  try {
    // Verificar autenticación
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      logger.warn('Dashboard plan API: Usuario no autenticado');
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    logger.info(`Dashboard plan API: Buscando plan para usuario ${user.id}`);

    // Usar cliente admin para bypass de RLS (la autenticación ya se verificó con SessionService)
    const supabase = createSharedAdminClient();

    // Obtener plan más reciente del usuario
    // Nota: La tabla study_plans no tiene columna 'status', se usa el más reciente
    const { data: plan, error: planError } = await supabase
      .from('study_plans')
      .select(`
        id,
        name,
        description,
        start_date,
        end_date,
        timezone,
        preferred_days,
        created_at,
        updated_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    logger.info(`Dashboard plan API: Resultado query - plan: ${plan?.id || 'null'}, error: ${planError?.code || 'none'}`);
    if (planError) {
      if (planError.code === 'PGRST116') {
        // No hay plan activo
        return NextResponse.json(
          { success: false, error: 'No hay plan de estudios activo' },
          { status: 404 }
        );
      }
      throw planError;
    }

    // Obtener sesiones del plan y calendario en paralelo
    const now = new Date();
    const [
      { data: allSessions, error: sessionsError },
      { data: calendarIntegration }
    ] = await Promise.all([
      supabase
        .from('study_sessions')
        .select(`
          id,
          plan_id,
          title,
          description,
          course_id,
          lesson_id,
          start_time,
          end_time,
          duration_minutes,
          status,
          is_ai_generated
        `)
        .eq('plan_id', plan.id)
        .order('start_time', { ascending: true })
        .limit(2000),
      supabase
        .from('calendar_integrations')
        .select('provider, updated_at')
        .eq('user_id', user.id)
        .limit(1)
        .single(),
    ]);

    if (sessionsError) {
      throw sessionsError;
    }

    // Calcular estadísticas
    interface SessionRow {
      id: string;
      plan_id: string | null;
      title: string;
      description: string | null;
      course_id: string | null;
      lesson_id: string | null;
      start_time: string;
      end_time: string;
      duration_minutes: number | null;
      status: string;
      is_ai_generated: boolean | null;
    }
    const sessions: SessionRow[] = (allSessions || []) as SessionRow[];
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter((s: SessionRow) => s.status === 'completed').length;
    const upcomingSessions = sessions.filter((s: SessionRow) =>
      s.status === 'planned' && new Date(s.start_time) > now
    ).length;

    // Formatear respuesta
    const formattedSessions = sessions.map((session: SessionRow) => ({
      id: session.id,
      planId: session.plan_id ?? plan.id,
      title: session.title,
      description: session.description ?? undefined,
      courseId: session.course_id ?? undefined,
      lessonId: session.lesson_id ?? undefined,
      startTime: session.start_time,
      endTime: session.end_time,
      durationMinutes: session.duration_minutes ?? 0,
      status: session.status,
      isAiGenerated: session.is_ai_generated ?? false,
    }));

    return NextResponse.json({
      success: true,
      data: {
        id: plan.id,
        name: plan.name,
        description: plan.description ?? undefined,
        startDate: plan.start_date ?? '',
        endDate: plan.end_date ?? undefined,
        timezone: plan.timezone,
        preferredDays: plan.preferred_days,
        sessions: formattedSessions,
        totalSessions,
        completedSessions,
        upcomingSessions,
        calendarConnected: !!calendarIntegration,
        calendarProvider: calendarIntegration?.provider,
        lastCalendarSync: calendarIntegration?.updated_at,
      },
    });

  } catch (error) {
    logger.error('Error obteniendo plan del dashboard:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}
