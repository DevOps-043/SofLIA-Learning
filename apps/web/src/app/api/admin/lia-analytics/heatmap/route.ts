import { logger as techDebtLogger } from '@/lib/utils/logger'
/**
 * API de LIA Analytics - Heatmap de Actividad
 * 
 * Genera datos para el mapa de calor de actividad por día/hora
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export const dynamic = 'force-dynamic';

function getDateRange(period: string): { startDate: Date; endDate: Date } {
  const now = new Date();
  const endDate = new Date(now);
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

  return { startDate, endDate };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';

    const { startDate, endDate } = getDateRange(period);

    // Obtener todos los mensajes del período
    const { data: messages, error } = await supabase
      .from('lia_messages')
      .select('created_at, response_time_ms')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) {
      techDebtLogger.error('Error fetching heatmap data:', error);
      return NextResponse.json(
        { success: false, error: 'Error al obtener datos' },
        { status: 500 }
      );
    }

    // Crear mapa de actividad por día/hora
    const heatmapData: Map<string, { count: number; totalResponseTime: number }> = new Map();
    
    messages?.forEach(msg => {
      if (!msg.created_at) return;
      
      const date = new Date(msg.created_at);
      const dayOfWeek = date.getUTCDay(); // 0-6
      const hour = date.getUTCHours(); // 0-23
      const key = `${dayOfWeek}-${hour}`;
      
      const existing = heatmapData.get(key) || { count: 0, totalResponseTime: 0 };
      heatmapData.set(key, {
        count: existing.count + 1,
        totalResponseTime: existing.totalResponseTime + (msg.response_time_ms || 0)
      });
    });

    // Convertir a array para el frontend
    const heatmap: Array<{
      dayOfWeek: number;
      hour: number;
      count: number;
      avgResponseTime: number;
    }> = [];

    // Asegurar que tenemos datos para todas las combinaciones día/hora
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const key = `${day}-${hour}`;
        const data = heatmapData.get(key) || { count: 0, totalResponseTime: 0 };
        
        heatmap.push({
          dayOfWeek: day,
          hour,
          count: data.count,
          avgResponseTime: data.count > 0 ? Math.round(data.totalResponseTime / data.count) : 0
        });
      }
    }

    // Encontrar hora pico
    const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    let peakHour = null;
    let maxCount = 0;

    heatmap.forEach(item => {
      if (item.count > maxCount) {
        maxCount = item.count;
        peakHour = {
          day: DAYS[item.dayOfWeek],
          hour: `${item.hour}:00`,
          count: item.count
        };
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        heatmap,
        totalMessages: messages?.length || 0,
        peakHour,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      }
    });

  } catch (error) {
    techDebtLogger.error('Error en LIA Analytics Heatmap:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
