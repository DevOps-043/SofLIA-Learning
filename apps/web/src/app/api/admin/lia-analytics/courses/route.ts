import { logger as techDebtLogger } from '@/lib/utils/logger'
/**
 * API de LIA Analytics - Cursos
 * 
 * Métricas de uso y engagement por Curso
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
    
    // Obtener parámetros
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    const courseId = searchParams.get('courseId');
    
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
    }
    
    // Consultar la vista de analíticas de conversaciones
    // Agrupamos dinámicamente según lo que necesitemos
    // Nota: Supabase JS no soporta GROUP BY nativo fácilmente en .select() para transformaciones complejas,
    // así que obtenemos los datos crudos de la vista y agrupamos en memoria (para volúmenes razonables)
    // o usamos .rpc() si tuviéramos una función almacenada (que no tenemos).
    // Dado que es un panel de admin, el volumen no debería ser masivo por ahora.
    
    let query = supabase
      .from('lia_conversation_analytics')
      .select(`
        course_id,
        course_title,
        module_id,
        module_title,
        lesson_id,
        lesson_title,
        total_tokens,
        total_cost_usd,
        duration_seconds,
        total_messages,
        user_id
      `)
      .eq('context_type', 'course')
      .gte('started_at', startDate.toISOString())
      .lte('started_at', endDate.toISOString());

    if (courseId) {
      query = query.eq('course_id', courseId);
    }
      
    const { data: rawData, error } = await query;
    
    if (error) {
      techDebtLogger.error('Error fetching course analytics:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    // Agrupación en memoria
    const coursesMap = new Map<string, {
      courseId: string;
      title: string;
      conversations: number;
      uniqueUsers: Set<string>;
      messages: number;
      tokens: number;
      cost: number;
      durationSum: number;
      durationCount: number;
      modules: Map<string, any>;
    }>();
    
    rawData?.forEach(row => {
      const cId = row.course_id || 'unknown';
      const cTitle = row.course_title || 'Curso Desconocido';
      
      const existing = coursesMap.get(cId) || {
        courseId: cId,
        title: cTitle,
        conversations: 0,
        uniqueUsers: new Set(),
        messages: 0,
        tokens: 0,
        cost: 0,
        durationSum: 0,
        durationCount: 0,
        modules: new Map()
      };
      
      existing.conversations++;
      if (row.user_id) existing.uniqueUsers.add(row.user_id);
      existing.messages += (row.total_messages || 0);
      existing.tokens += (row.total_tokens || 0);
      existing.cost += (row.total_cost_usd || 0);
      
      if (row.duration_seconds) {
        existing.durationSum += row.duration_seconds;
        existing.durationCount++;
      }
      
      // Agrupar también por módulo si hay datos
      if (row.module_id) {
        const mKey = row.module_id;
        const mTitle = row.module_title || 'Módulo sin título';
        const modExisting = existing.modules.get(mKey) || {
            moduleId: mKey,
            title: mTitle,
            conversations: 0,
            tokens: 0,
            cost: 0
        };
        modExisting.conversations++;
        modExisting.tokens += (row.total_tokens || 0);
        modExisting.cost += (row.total_cost_usd || 0);
        existing.modules.set(mKey, modExisting);
      }
      
      coursesMap.set(cId, existing);
    });
    
    // Formatear resultados
    const courses = Array.from(coursesMap.values()).map(c => ({
      courseId: c.courseId,
      title: c.title,
      totalConversations: c.conversations,
      uniqueUsers: c.uniqueUsers.size,
      totalMessages: c.messages,
      totalTokens: c.tokens,
      totalCost: Number(c.cost.toFixed(6)),
      avgDurationSeconds: c.durationCount > 0 ? Math.round(c.durationSum / c.durationCount) : 0,
      // Top módulos por costo
      topModules: Array.from(c.modules.values())
        .map(m => ({...m, totalCost: Number(m.cost.toFixed(6))}))
        .sort((a, b) => b.cost - a.cost)
        .slice(0, 5)
    })).sort((a, b) => b.totalCost - a.totalCost); // Ordenar por costo descendente
    
    return NextResponse.json({
      success: true,
      data: {
        courses,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          type: period
        }
      }
    });
    
  } catch (error) {
    techDebtLogger.error('Error en LIA Analytics Courses:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
