import { logger as techDebtLogger } from '@/lib/utils/logger'
/**
 * API de LIA Analytics - Detalle por Hora
 * 
 * Obtiene información detallada de actividad para un día/hora específico
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export const dynamic = 'force-dynamic';

interface LiaAnalyticsMessageRow {
  message_id: string
  conversation_id: string
  role: string
  content: string | null
  tokens_used: number | null
  cost_usd: number | null
  response_time_ms: number | null
  created_at: string
  model_used: string | null
}

interface LiaAnalyticsConversationRow {
  conversation_id: string
  user_id: string
  context_type: string | null
  started_at: string | null
  total_messages: number | null
  course_id: string | null
  lesson_id: string | null
}

interface LiaAnalyticsUserRow {
  id: string
  username: string | null
  first_name: string | null
  last_name: string | null
  display_name: string | null
  email: string | null
  profile_picture_url: string | null
}

interface UserActivityEntry {
  user: LiaAnalyticsUserRow | undefined
  messageCount: number
  conversations: string[]
  questions: string[]
  tokens: number
  cost: number
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const dayOfWeek = parseInt(searchParams.get('dayOfWeek') || '0');
    const hour = parseInt(searchParams.get('hour') || '0');
    const period = searchParams.get('period') || 'month';

    // Calcular rango de fechas según el período
    const now = new Date();
    let startDate = new Date(now);
    
    switch (period) {
      case 'today':
        startDate.setUTCHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setUTCDate(startDate.getUTCDate() - 7);
        break;
      case 'month':
        startDate.setUTCMonth(startDate.getUTCMonth() - 1);
        break;
      case 'quarter':
        startDate.setUTCMonth(startDate.getUTCMonth() - 3);
        break;
      case 'year':
        startDate.setUTCFullYear(startDate.getUTCFullYear() - 1);
        break;
      default:
        startDate.setUTCMonth(startDate.getUTCMonth() - 1);
    }

    // Obtener todos los mensajes del período
    const { data: allMessages, error: msgError } = await supabase
      .from('lia_messages')
      .select(`
        message_id,
        conversation_id,
        role,
        content,
        tokens_used,
        cost_usd,
        response_time_ms,
        created_at,
        model_used
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString())
      .order('created_at', { ascending: false });

    if (msgError) {
      techDebtLogger.error('Error fetching messages:', msgError);
      return NextResponse.json(
        { success: false, error: 'Error al obtener mensajes' },
        { status: 500 }
      );
    }

    // Filtrar mensajes que corresponden al día de la semana y hora específicos
    const filteredMessages = allMessages?.filter(msg => {
      const msgDate = new Date(msg.created_at);
      return msgDate.getUTCDay() === dayOfWeek && msgDate.getUTCHours() === hour;
    }) || [];

    // Obtener IDs de conversaciones únicas
    const conversationIds = [...new Set(filteredMessages.map(m => m.conversation_id))];

    // Obtener detalles de las conversaciones
    let conversations: LiaAnalyticsConversationRow[] = [];
    if (conversationIds.length > 0) {
      const { data: convData } = await supabase
        .from('lia_conversations')
        .select(`
          conversation_id,
          user_id,
          context_type,
          started_at,
          total_messages,
          course_id,
          lesson_id
        `)
        .in('conversation_id', conversationIds);
      
      conversations = convData || [];
    }

    // Obtener información de usuarios
    const userIds = [...new Set(conversations.map(c => c.user_id))];
    let usersMap = new Map<string, LiaAnalyticsUserRow>();
    
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, username, first_name, last_name, display_name, email, profile_picture_url')
        .in('id', userIds);
      
      usersMap = new Map(users?.map(u => [u.id, u]) || []);
    }

    // Helper para nombre de usuario
    const getUserName = (u: LiaAnalyticsUserRow | undefined) => {
      if (!u) return 'Usuario desconocido';
      if (u.display_name) return u.display_name;
      const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
      if (fullName) return fullName;
      return u.username || u.email?.split('@')[0] || 'Usuario';
    };

    // Calcular métricas
    const userMessages = filteredMessages.filter(m => m.role === 'user');
    const assistantMessages = filteredMessages.filter(m => m.role === 'assistant');
    
    const totalTokens = filteredMessages.reduce((sum, m) => sum + (m.tokens_used || 0), 0);
    const totalCost = filteredMessages.reduce((sum, m) => sum + (m.cost_usd || 0), 0);
    const avgResponseTime = assistantMessages.length > 0
      ? Math.round(assistantMessages.reduce((sum, m) => sum + (m.response_time_ms || 0), 0) / assistantMessages.length)
      : 0;

    // Agrupar por usuario con detalles
    const userActivity = new Map<string, UserActivityEntry>();

    filteredMessages.forEach(msg => {
      const conv = conversations.find(c => c.conversation_id === msg.conversation_id);
      if (!conv) return;

      const userId = conv.user_id;
      const existing = userActivity.get(userId) || {
        user: usersMap.get(userId),
        messageCount: 0,
        conversations: [],
        questions: [],
        tokens: 0,
        cost: 0
      };

      existing.messageCount++;
      existing.tokens += msg.tokens_used || 0;
      existing.cost += msg.cost_usd || 0;

      if (!existing.conversations.includes(msg.conversation_id)) {
        existing.conversations.push(msg.conversation_id);
      }

      if (msg.role === 'user' && msg.content && msg.content.length > 10) {
        existing.questions.push(msg.content.slice(0, 100));
      }

      userActivity.set(userId, existing);
    });

    // Convertir a array ordenado por actividad
    const topUsers = Array.from(userActivity.values())
      .map(ua => ({
        name: getUserName(ua.user),
        email: ua.user?.email,
        avatar: ua.user?.profile_picture_url,
        messageCount: ua.messageCount,
        conversationCount: ua.conversations.length,
        questions: ua.questions.slice(0, 3),
        tokens: ua.tokens,
        cost: Number(ua.cost.toFixed(6))
      }))
      .sort((a, b) => b.messageCount - a.messageCount)
      .slice(0, 10);

    // Obtener preguntas más interesantes (más largas = probablemente más sustanciales)
    const topQuestions = userMessages
      .filter(m => m.content && m.content.length > 20)
      .sort((a, b) => (b.content?.length || 0) - (a.content?.length || 0))
      .slice(0, 10)
      .map(m => ({
        content: m.content.slice(0, 150),
        timestamp: m.created_at,
        responseTime: assistantMessages.find(am => 
          am.conversation_id === m.conversation_id && 
          new Date(am.created_at) > new Date(m.created_at)
        )?.response_time_ms || null
      }));

    // Distribución por contexto
    const contextCounts: Record<string, number> = {};
    conversations.forEach(conv => {
      const ctx = conv.context_type || 'general';
      contextCounts[ctx] = (contextCounts[ctx] || 0) + 1;
    });

    // Modelos usados
    const modelCounts: Record<string, number> = {};
    assistantMessages.forEach(msg => {
      const model = msg.model_used || 'unknown';
      modelCounts[model] = (modelCounts[model] || 0) + 1;
    });

    // Fechas específicas en que ocurrió actividad
    const activityDates = [...new Set(filteredMessages.map(m => {
      const d = new Date(m.created_at);
      return d.toISOString().split('T')[0];
    }))].sort().reverse().slice(0, 10);

    const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    return NextResponse.json({
      success: true,
      data: {
        slot: {
          dayOfWeek,
          dayName: DAYS[dayOfWeek],
          hour,
          hourFormatted: `${hour}:00 - ${hour}:59`
        },
        summary: {
          totalMessages: filteredMessages.length,
          userMessages: userMessages.length,
          assistantMessages: assistantMessages.length,
          uniqueUsers: userIds.length,
          uniqueConversations: conversationIds.length,
          totalTokens,
          totalCost: Number(totalCost.toFixed(6)),
          avgResponseTime
        },
        topUsers,
        topQuestions,
        contextDistribution: Object.entries(contextCounts).map(([context, count]) => ({
          context,
          count,
          percentage: Math.round((count / conversationIds.length) * 100)
        })),
        modelsUsed: Object.entries(modelCounts).map(([model, count]) => ({
          model: model.replace('gemini-', 'Gemini '),
          count
        })),
        activityDates,
        period: {
          start: startDate.toISOString(),
          end: now.toISOString()
        }
      }
    });

  } catch (error) {
    techDebtLogger.error('Error en LIA Analytics Hour Detail:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
