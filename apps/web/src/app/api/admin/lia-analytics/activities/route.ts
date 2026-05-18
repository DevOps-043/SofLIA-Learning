import { logger as techDebtLogger } from '@/lib/utils/logger'
/**
 * API de LIA Analytics - Actividades
 * 
 * Métricas de rendimiento de actividades interactivas
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
    
    // Obtener todas las actividades en el período
    const { data: activities } = await supabase
      .from('lia_activity_completions')
      .select(`
        completion_id,
        activity_id,
        user_id,
        status,
        total_steps,
        completed_steps,
        time_to_complete_seconds,
        lia_had_to_redirect,
        started_at,
        completed_at
      `)
      .gte('started_at', startDate.toISOString())
      .lte('started_at', endDate.toISOString());
    
    if (!activities || activities.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          summary: {
            totalActivities: 0,
            completedActivities: 0,
            abandonedActivities: 0,
            inProgressActivities: 0,
            completionRate: 0,
            abandonRate: 0,
            avgCompletionTimeSeconds: 0,
            avgRedirections: 0
          },
          byStatus: [],
          byActivity: [],
          period: { start: startDate.toISOString(), end: endDate.toISOString() }
        }
      });
    }
    
    // Calcular métricas por estado
    const statusCounts = {
      started: 0,
      in_progress: 0,
      completed: 0,
      abandoned: 0
    };
    
    let totalCompletionTime = 0;
    let completionTimeCount = 0;
    let totalRedirections = 0;
    
    activities.forEach(a => {
      const status = a.status as keyof typeof statusCounts;
      if (statusCounts[status] !== undefined) {
        statusCounts[status]++;
      }
      
      if (a.time_to_complete_seconds) {
        totalCompletionTime += a.time_to_complete_seconds;
        completionTimeCount++;
      }
      
      totalRedirections += a.lia_had_to_redirect || 0;
    });
    
    const totalActivities = activities.length;
    const completionRate = totalActivities > 0 
      ? Number(((statusCounts.completed / totalActivities) * 100).toFixed(1))
      : 0;
    const abandonRate = totalActivities > 0
      ? Number(((statusCounts.abandoned / totalActivities) * 100).toFixed(1))
      : 0;
    const avgCompletionTimeSeconds = completionTimeCount > 0
      ? Math.round(totalCompletionTime / completionTimeCount)
      : 0;
    const avgRedirections = totalActivities > 0
      ? Number((totalRedirections / totalActivities).toFixed(2))
      : 0;
    
    // Agrupar por actividad
    const activityGroups = new Map<string, {
      activityId: string;
      total: number;
      completed: number;
      abandoned: number;
      avgTime: number;
      avgRedirections: number;
      times: number[];
      redirections: number[];
    }>();
    
    activities.forEach(a => {
      const activityId = a.activity_id || 'unknown';
      const existing = activityGroups.get(activityId) || {
        activityId,
        total: 0,
        completed: 0,
        abandoned: 0,
        avgTime: 0,
        avgRedirections: 0,
        times: [],
        redirections: []
      };
      
      existing.total++;
      if (a.status === 'completed') existing.completed++;
      if (a.status === 'abandoned') existing.abandoned++;
      if (a.time_to_complete_seconds) existing.times.push(a.time_to_complete_seconds);
      existing.redirections.push(a.lia_had_to_redirect || 0);
      
      activityGroups.set(activityId, existing);
    });
    
    const byActivity = Array.from(activityGroups.values()).map(group => ({
      activityId: group.activityId,
      total: group.total,
      completed: group.completed,
      abandoned: group.abandoned,
      completionRate: group.total > 0 
        ? Number(((group.completed / group.total) * 100).toFixed(1))
        : 0,
      avgCompletionTimeSeconds: group.times.length > 0
        ? Math.round(group.times.reduce((a, b) => a + b, 0) / group.times.length)
        : 0,
      avgRedirections: group.redirections.length > 0
        ? Number((group.redirections.reduce((a, b) => a + b, 0) / group.redirections.length).toFixed(2))
        : 0
    })).sort((a, b) => b.total - a.total);
    
    // Distribución por estado
    const byStatus = [
      { status: 'completed', count: statusCounts.completed, percentage: Number(((statusCounts.completed / totalActivities) * 100).toFixed(1)), color: '#10b981' },
      { status: 'in_progress', count: statusCounts.in_progress, percentage: Number(((statusCounts.in_progress / totalActivities) * 100).toFixed(1)), color: '#3b82f6' },
      { status: 'started', count: statusCounts.started, percentage: Number(((statusCounts.started / totalActivities) * 100).toFixed(1)), color: '#f59e0b' },
      { status: 'abandoned', count: statusCounts.abandoned, percentage: Number(((statusCounts.abandoned / totalActivities) * 100).toFixed(1)), color: '#ef4444' }
    ].filter(s => s.count > 0);
    
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalActivities,
          completedActivities: statusCounts.completed,
          abandonedActivities: statusCounts.abandoned,
          inProgressActivities: statusCounts.in_progress + statusCounts.started,
          completionRate,
          abandonRate,
          avgCompletionTimeSeconds,
          avgRedirections
        },
        byStatus,
        byActivity: byActivity.slice(0, 10), // Top 10 actividades
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          type: period
        }
      }
    });
    
  } catch (error) {
    techDebtLogger.error('Error en LIA Analytics Activities:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
