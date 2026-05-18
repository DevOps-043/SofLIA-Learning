import { logger as techDebtLogger } from '@/lib/utils/logger'
/**
 * API Endpoint: Lesson Tracking Event
 * 
 * POST /api/study-planner/lesson-tracking/event
 * 
 * Registra eventos durante el estudio de una lección:
 * - video_ended: terminó de ver el video
 * - lia_message: envió mensaje a LIA
 * - activity: heartbeat de actividad general
 */

import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '../../../../../features/auth/services/session.service';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../../../lib/supabase/types';

// Crear cliente admin
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Variables de Supabase no configuradas');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

type EventType = 'video_ended' | 'lia_message' | 'activity';

interface EventRequest {
  trackingId: string;
  eventType: EventType;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verificar autenticación
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ 
        error: 'No autorizado',
        success: false
      }, { status: 401 });
    }

    const body: EventRequest = await request.json();
    const { trackingId, eventType } = body;

    if (!trackingId || !eventType) {
      return NextResponse.json({ 
        error: 'trackingId y eventType son requeridos',
        success: false
      }, { status: 400 });
    }

    const supabase = createAdminClient();
    const now = new Date();

    // Verificar que el tracking existe y pertenece al usuario
    const { data: tracking, error: trackingError } = await supabase
      .from('lesson_tracking')
      .select('id, status, lia_first_message_at, t_restante_minutes')
      .eq('id', trackingId)
      .eq('user_id', user.id)
      .single();

    if (trackingError || !tracking) {
      return NextResponse.json({ 
        error: 'Tracking no encontrado',
        success: false
      }, { status: 404 });
    }

    if (tracking.status !== 'in_progress') {
      return NextResponse.json({ 
        message: 'Tracking ya esta cerrado; evento ignorado de forma idempotente',
        success: true,
        ignored: true
      });
    }

    // Preparar actualización según el tipo de evento
    const updates: Record<string, unknown> = {
      last_activity_at: now.toISOString(),
      updated_at: now.toISOString()
    };

    switch (eventType) {
      case 'video_ended':
        updates.video_ended_at = now.toISOString();
        // Establecer post_content_start_at si no está definido
        updates.post_content_start_at = now.toISOString();
        break;
        
      case 'lia_message':
        // Actualizar timestamps de LIA
        updates.lia_last_message_at = now.toISOString();
        
        // Si es el primer mensaje, registrarlo y programar primer análisis
        if (!tracking.lia_first_message_at) {
          updates.lia_first_message_at = now.toISOString();
          
          // Programar primer análisis: ahora + T_restante (mínimo 5 min)
          const t_restante = tracking.t_restante_minutes || 5;
          const delayMinutes = Math.max(t_restante, 5);
          const nextAnalysis = new Date(now.getTime() + delayMinutes * 60 * 1000);
          updates.next_analysis_at = nextAnalysis.toISOString();
        }
        break;
        
      case 'activity':
        // Solo actualizar last_activity_at (ya hecho arriba)
        // Si no hay análisis programado y hay post_content_start_at, programar
        const { data: currentTracking } = await supabase
          .from('lesson_tracking')
          .select('next_analysis_at, post_content_start_at')
          .eq('id', trackingId)
          .single();
          
        if (currentTracking?.post_content_start_at && !currentTracking?.next_analysis_at) {
          // Programar análisis en 5 minutos
          const nextAnalysis = new Date(now.getTime() + 5 * 60 * 1000);
          updates.next_analysis_at = nextAnalysis.toISOString();
        }
        break;
    }

    // Aplicar actualización
    const { error: updateError } = await supabase
      .from('lesson_tracking')
      .update(updates)
      .eq('id', trackingId);

    if (updateError) {
      techDebtLogger.error('Error actualizando lesson tracking:', updateError);
      return NextResponse.json({ 
        error: `Error al registrar evento: ${updateError.message}`,
        success: false
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Evento ${eventType} registrado`,
      eventType
    });

  } catch (error: unknown) {
    techDebtLogger.error('Error en POST /api/study-planner/lesson-tracking/event:', error);
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ 
      error: message,
      success: false
    }, { status: 500 });
  }
}
