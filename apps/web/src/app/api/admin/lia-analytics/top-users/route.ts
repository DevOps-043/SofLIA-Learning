import { logger as techDebtLogger } from '@/lib/utils/logger'
/**
 * API de LIA Analytics - Top Usuarios
 * 
 * Obtiene los usuarios con mayor uso de LIA
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import {
  resolveLiaMessageCost,
  resolveLiaMessageTokens,
} from '../lia-analytics/message-metrics'
import type { LiaMessageMetricRow } from '../lia-analytics/types'

export const dynamic = 'force-dynamic';

interface AnalyticsUserInfo {
  id: string
  username?: string | null
  first_name?: string | null
  last_name?: string | null
  display_name?: string | null
  email?: string | null
  profile_picture_url?: string | null
  cargo_rol?: string | null
}

export async function GET(request: NextRequest) {
  try {
    // ✅ SEGURIDAD: Verificar autenticación y autorización de admin
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;
    
    const supabase = await createClient();
    
    // Obtener parámetros
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'cost'; // 'cost', 'messages', 'tokens'
    const period = searchParams.get('period') || 'month';
    
    // Calcular fechas según el período
    const endDate = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'all':
        startDate = new Date('2020-01-01');
        break;
    }
    
    // Obtener conversaciones en el período
    const { data: conversations } = await supabase
      .from('lia_conversations')
      .select('conversation_id, user_id, total_messages, total_lia_messages')
      .gte('started_at', startDate.toISOString())
      .lte('started_at', endDate.toISOString());
    
    if (!conversations || conversations.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          users: [],
          period: { start: startDate.toISOString(), end: endDate.toISOString() }
        }
      });
    }
    
    // Obtener mensajes con métricas
    const conversationIds = conversations.map(c => c.conversation_id);
    
    const { data: messages } = await supabase
      .from('lia_messages')
      .select('conversation_id, content, tokens_used, cost_usd, model_used, role')
      .in('conversation_id', conversationIds);
    
    // Crear mapa de métricas por conversación
    const metricsMap = new Map<string, { tokens: number; cost: number }>();
    ;((messages || []) as LiaMessageMetricRow[]).forEach(m => {
      if (!m.conversation_id) return
      const existing = metricsMap.get(m.conversation_id) || { tokens: 0, cost: 0 };
      metricsMap.set(m.conversation_id, {
        tokens: existing.tokens + resolveLiaMessageTokens(m),
        cost: existing.cost + resolveLiaMessageCost(m)
      });
    });
    
    // Agrupar por usuario
    const userStats = new Map<string, {
      userId: string;
      conversations: number;
      messages: number;
      liaMessages: number;
      tokens: number;
      cost: number;
    }>();
    
    conversations.forEach(conv => {
      const metrics = metricsMap.get(conv.conversation_id) || { tokens: 0, cost: 0 };
      const existing = userStats.get(conv.user_id) || {
        userId: conv.user_id,
        conversations: 0,
        messages: 0,
        liaMessages: 0,
        tokens: 0,
        cost: 0
      };
      
      userStats.set(conv.user_id, {
        userId: conv.user_id,
        conversations: existing.conversations + 1,
        messages: existing.messages + (conv.total_messages || 0),
        liaMessages: existing.liaMessages + (conv.total_lia_messages || 0),
        tokens: existing.tokens + metrics.tokens,
        cost: existing.cost + metrics.cost
      });
    });
    
    // Convertir a array y ordenar
    let sortedUsers = Array.from(userStats.values());
    
    switch (sortBy) {
      case 'cost':
        sortedUsers.sort((a, b) => b.cost - a.cost);
        break;
      case 'tokens':
        sortedUsers.sort((a, b) => b.tokens - a.tokens);
        break;
      case 'messages':
        sortedUsers.sort((a, b) => b.messages - a.messages);
        break;
      case 'conversations':
        sortedUsers.sort((a, b) => b.conversations - a.conversations);
        break;
    }
    
    // Limitar resultados
    sortedUsers = sortedUsers.slice(0, limit);
    
    // Obtener información de usuarios (usando tabla 'users')
    const userIds = sortedUsers.map(u => u.userId);
    let usersMap = new Map();
    
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, username, first_name, last_name, display_name, email, profile_picture_url, cargo_rol')
        .in('id', userIds);
      
      usersMap = new Map(users?.map(u => [u.id, u]) || []);
    }
    
    // Enriquecer datos
    const enrichedUsers = sortedUsers.map((stats, index) => {
      const userInfo = usersMap.get(stats.userId);
      
      // Construir nombre: priorizar display_name, luego first_name + last_name, luego username
      const getUserName = (u: AnalyticsUserInfo) => {
        if (u.display_name) return u.display_name;
        const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
        if (fullName) return fullName;
        return u.username || 'Usuario';
      };
      
      return {
        rank: index + 1,
        user: userInfo ? {
          id: userInfo.id,
          name: getUserName(userInfo),
          email: userInfo.email,
          avatar: userInfo.profile_picture_url,
          role: userInfo.cargo_rol
        } : null,
        stats: {
          conversations: stats.conversations,
          messages: stats.messages,
          liaMessages: stats.liaMessages,
          tokens: stats.tokens,
          cost: Number(stats.cost.toFixed(6)),
          avgTokensPerConversation: stats.conversations > 0 
            ? Math.round(stats.tokens / stats.conversations)
            : 0,
          avgCostPerConversation: stats.conversations > 0 
            ? Number((stats.cost / stats.conversations).toFixed(6))
            : 0
        }
      };
    });
    
    // Calcular totales
    const totals = {
      totalUsers: userStats.size,
      totalConversations: Array.from(userStats.values()).reduce((sum, u) => sum + u.conversations, 0),
      totalMessages: Array.from(userStats.values()).reduce((sum, u) => sum + u.messages, 0),
      totalTokens: Array.from(userStats.values()).reduce((sum, u) => sum + u.tokens, 0),
      totalCost: Array.from(userStats.values()).reduce((sum, u) => sum + u.cost, 0)
    };
    
    return NextResponse.json({
      success: true,
      data: {
        users: enrichedUsers,
        totals: {
          ...totals,
          totalCost: Number(totals.totalCost.toFixed(6))
        },
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          type: period
        }
      }
    });
    
  } catch (error) {
    techDebtLogger.error('Error en LIA Analytics Top Users:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
