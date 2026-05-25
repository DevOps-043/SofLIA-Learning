import { logger as techDebtLogger } from '@/lib/utils/logger'
/**
 * API de LIA Analytics - Conversaciones
 * 
 * Lista paginada de conversaciones con detalles
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // ✅ SEGURIDAD: Verificar autenticación y autorización de admin
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;
    
    const supabase = await createClient();
    
    // ✅ DEBUG: Verificar total de conversaciones sin filtros
    const { count: totalWithoutFilters, error: countError } = await supabase
      .from('lia_conversations')
      .select('id', { count: 'exact', head: true });
    
    if (countError) {
      techDebtLogger.error('[LIA Analytics Conversations] Error counting total:', countError);
    }

    // Obtener parámetros
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const contextType = searchParams.get('contextType');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sortBy = searchParams.get('sortBy') || 'started_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    const offset = (page - 1) * limit;
    
    // Construir query base usando la VISTA en lugar de tablas crudas
    let query = supabase
      .from('lia_conversation_analytics')
      .select(
        'conversation_id, user_id, user_name, user_email, user_avatar, context_type, course_title, lesson_title, started_at, ended_at, total_messages, total_lia_messages, total_tokens, total_cost_usd, avg_response_time_ms, duration_seconds, conversation_completed',
        { count: 'exact' }
      );
    
    // Aplicar filtros
    if (contextType) {
      query = query.eq('context_type', contextType);
    }
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    if (startDate) {
      query = query.gte('started_at', startDate);
    }
    
    if (endDate) {
      query = query.lte('started_at', endDate);
    }
    
    // Aplicar ordenamiento y paginación
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);
    
    const { data: conversations, count, error } = await query;
    
    if (error) {
      techDebtLogger.error('Error fetching conversations:', error);
      return NextResponse.json(
        { success: false, error: 'Error al obtener conversaciones', details: error.message },
        { status: 500 }
      );
    }
    
    // Mapear los datos de la vista al formato esperado por el frontend
    const enrichedConversations = conversations?.map(conv => {
      // La duración en la vista se llama duration_seconds
      // Costo se llama total_cost_usd
      // Tokens se llama total_tokens
      
      return {
        id: conv.conversation_id,
        user: conv.user_id ? {
          id: conv.user_id,
          name: conv.user_name || 'Usuario',
          email: conv.user_email,
          avatar: conv.user_avatar
        } : null,
        contextType: conv.context_type || 'general',
        courseTitle: conv.course_title,
        lessonTitle: conv.lesson_title,
        startedAt: conv.started_at,
        endedAt: conv.ended_at,
        totalMessages: conv.total_messages || 0,
        liaMessages: conv.total_lia_messages || 0,
        tokens: conv.total_tokens || 0,
        cost: Number((conv.total_cost_usd || 0).toFixed(6)),
        avgResponseTimeMs: Math.round(conv.avg_response_time_ms || 0),
        durationSeconds: conv.duration_seconds,
        isCompleted: conv.conversation_completed,
        deviceType: null, // La vista no tiene device_type por defecto, si es necesario agregarlo
        browser: null
      };
    }) || [];
    
    // Calcular estadísticas de la página actual
    const pageStats = {
      totalTokens: enrichedConversations.reduce((sum, c) => sum + c.tokens, 0),
      totalCost: enrichedConversations.reduce((sum, c) => sum + c.cost, 0),
      avgMessages: enrichedConversations.length > 0 
        ? Math.round(enrichedConversations.reduce((sum, c) => sum + c.totalMessages, 0) / enrichedConversations.length)
        : 0
    };
    
    return NextResponse.json({
      success: true,
      data: {
        conversations: enrichedConversations,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        },
        pageStats
      }
    });
    
  } catch (error) {
    techDebtLogger.error('Error en LIA Analytics Conversations:', error);
    techDebtLogger.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
