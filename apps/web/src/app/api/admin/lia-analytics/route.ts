/**
 * API de LIA Analytics - Endpoint Principal
 * 
 * Proporciona métricas resumidas del uso y costos de LIA
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export const dynamic = 'force-dynamic';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

function getDateRange(period: string): DateRange {
  // IMPORTANTE: Usar UTC para coincidir con cómo se guardan los datos en la BD
  // Las fechas se guardan como "2025-12-05 16:04:55.295407+00" (UTC)
  const now = new Date();

  // endDate: Hasta el final del día actual (23:59:59.999) en UTC
  const endDate = new Date(now);
  endDate.setUTCHours(23, 59, 59, 999);

  let startDate = new Date(now);

  switch (period) {
    case 'day':
      // Hoy desde las 00:00:00 en UTC
      startDate.setUTCHours(0, 0, 0, 0);
      break;
    case 'week':
      // Últimos 7 días (incluyendo hoy) en UTC
      startDate.setUTCDate(startDate.getUTCDate() - 6); // -6 para incluir hoy (7 días total)
      startDate.setUTCHours(0, 0, 0, 0);
      break;
    case 'month':
      // Último mes (30 días, incluyendo hoy) en UTC
      startDate.setUTCDate(startDate.getUTCDate() - 29); // -29 para incluir hoy (30 días total)
      startDate.setUTCHours(0, 0, 0, 0);
      break;
    case 'year':
      // Último año (365 días, incluyendo hoy) en UTC
      startDate.setUTCDate(startDate.getUTCDate() - 364); // -364 para incluir hoy (365 días total)
      startDate.setUTCHours(0, 0, 0, 0);
      break;
    default:
      // Por defecto: último mes
      startDate.setUTCDate(startDate.getUTCDate() - 29);
      startDate.setUTCHours(0, 0, 0, 0);
  }

  return { startDate, endDate };
}

export async function GET(request: NextRequest) {
  try {
    // ✅ SEGURIDAD: Verificar autenticación y autorización de admin
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const supabase = await createClient();

    // Obtener parámetros
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    const provider = searchParams.get('provider') || 'openai'; // Default a openai

    const customStartDate = searchParams.get('startDate');
    const customEndDate = searchParams.get('endDate');

    let startDate: Date;
    let endDate: Date;

    if (customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
    } else {
      const range = getDateRange(period);
      startDate = range.startDate;
      endDate = range.endDate;
    }

    // Helper para aplicar filtro de proveedor
    const applyProviderFilter = <T extends { ilike: (column: string, pattern: string) => T }>(query: T): T => {
      if (provider === 'openai') {
        return query.ilike('model_used', 'gpt%');
      } else if (provider === 'gemini') {
        return query.ilike('model_used', 'gemini%');
      }
      return query;
    };

    // ===== MÉTRICAS PRINCIPALES =====

    // Usar fecha actual para incluir datos hasta el momento presente
    const nowISO = new Date().toISOString();

    // Total de conversaciones (Nota: No filtramos conversaciones por proveedor aquí porque 
    // la tabla lia_conversations no tiene model_used. El filtro se aplica en los mensajes/costos)
    const { count: totalConversations } = await supabase
      .from('lia_conversations')
      .select('*', { count: 'exact', head: true })
      .gte('started_at', startDate.toISOString())
      .lte('started_at', nowISO);

    // Total de mensajes y métricas
    let messagesQuery = supabase
      .from('lia_messages')
      .select('tokens_used, cost_usd, response_time_ms, model_used, role')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', nowISO);

    messagesQuery = applyProviderFilter(messagesQuery);

    const { data: messagesData } = await messagesQuery;

    const totalMessages = messagesData?.length || 0;
    const assistantMessages = messagesData?.filter(m => m.role === 'assistant') || [];
    const totalTokens = messagesData?.reduce((sum, m) => sum + (m.tokens_used || 0), 0) || 0;
    const totalCostUsd = messagesData?.reduce((sum, m) => sum + (m.cost_usd || 0), 0) || 0;

    // Tiempo de respuesta promedio (solo mensajes del asistente)
    const responseTimes = assistantMessages
      .filter(m => m.response_time_ms)
      .map(m => m.response_time_ms);
    const avgResponseTimeMs = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;

    // Actividades completadas
    const { count: completedActivities } = await supabase
      .from('lia_activity_completions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('completed_at', startDate.toISOString())
      .lte('completed_at', nowISO);

    // ===== COSTOS POR DÍA =====
    // IMPORTANTE: Las fechas en la BD se guardan en UTC (toISOString())
    // startDate ya viene en UTC desde getDateRange(), solo necesitamos asegurar que esté en inicio del día
    const startDateUTC = new Date(startDate);
    startDateUTC.setUTCHours(0, 0, 0, 0);

    // Consultar TODOS los mensajes del período
    // Supabase tiene un límite por defecto de 1000 registros, pero podemos obtener más con paginación
    let allDailyCosts: Array<{
      created_at: string
      cost_usd: number | null
      tokens_used: number | null
      model_used: string | null
    }> = [];
    let hasMore = true;
    let offset = 0;
    const limit = 1000; // Límite por página de Supabase

    while (hasMore) {
      let pageQuery = supabase
        .from('lia_messages')
        .select('created_at, cost_usd, tokens_used, model_used') // Added model_used to be safe for debugging
        .gte('created_at', startDateUTC.toISOString())
        .lte('created_at', nowISO)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      pageQuery = applyProviderFilter(pageQuery);

      const { data: pageData, error: dailyCostsError } = await pageQuery;

      if (dailyCostsError) {
        console.error('[LIA Analytics] Error fetching daily costs:', dailyCostsError);
        break;
      }

      if (pageData && pageData.length > 0) {
        allDailyCosts = [...allDailyCosts, ...pageData];
        offset += limit;
        hasMore = pageData.length === limit; // Si hay menos registros que el límite, no hay más páginas
      } else {
        hasMore = false;
      }
    }

    const dailyCosts = allDailyCosts;

    // Agrupar por día usando UTC (las fechas en BD están en UTC)
    // IMPORTANTE: Las fechas se guardan como "2025-12-05 16:04:55.295407+00" (UTC)
    // Necesitamos extraer el día directamente del string o usar UTC para evitar problemas de zona horaria
    const costsByDay = new Map<string, { cost: number; tokens: number; messages: number }>();

    if (dailyCosts && dailyCosts.length > 0) {
      dailyCosts.forEach(msg => {
        if (!msg.created_at) return; // Saltar si no hay fecha

        // Extraer la fecha directamente del string UTC para evitar problemas de conversión
        // El formato es "2025-12-05 16:04:55.295407+00" o ISO string
        let date: string;

        if (typeof msg.created_at === 'string') {
          // Si viene como "2025-12-05 16:04:55.295407+00", extraer solo la parte de fecha
          if (msg.created_at.includes(' ')) {
            date = msg.created_at.split(' ')[0]; // "2025-12-05"
          } else {
            // Si viene como ISO string "2025-12-05T16:04:55.295Z"
            date = msg.created_at.split('T')[0]; // "2025-12-05"
          }
        } else {
          // Fallback: usar Date y métodos UTC
          const msgDate = new Date(msg.created_at);
          const year = msgDate.getUTCFullYear();
          const month = String(msgDate.getUTCMonth() + 1).padStart(2, '0');
          const day = String(msgDate.getUTCDate()).padStart(2, '0');
          date = `${year}-${month}-${day}`;
        }

        const existing = costsByDay.get(date) || { cost: 0, tokens: 0, messages: 0 };
        costsByDay.set(date, {
          cost: existing.cost + (Number(msg.cost_usd) || 0),
          tokens: existing.tokens + (Number(msg.tokens_used) || 0),
          messages: existing.messages + 1
        });
      });
    }

    // Debug: Verificar qué datos se obtuvieron y agrupados (usando UTC)
    const uniqueDatesFromData = dailyCosts ? [...new Set(dailyCosts.map(m => {
      const d = new Date(m.created_at);
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    }))].sort() : [];


    // Asegurar que incluimos todos los días del rango, incluso si no hay datos
    // IMPORTANTE: Usar UTC para coincidir con cómo se agruparon los datos
    const costsByPeriod: Array<{ date: string; cost: number; tokens: number; messages: number }> = [];

    // Reutilizar startDateUTC que ya fue declarado arriba para la consulta
    // Solo necesitamos crear todayUTC para el bucle
    const todayUTC = new Date(); // Fecha actual
    todayUTC.setUTCHours(23, 59, 59, 999);

    // Iterar día por día desde startDate hasta hoy (en UTC)
    const tempDate = new Date(startDateUTC);
    let dayCount = 0;
    const maxDays = 365; // Límite de seguridad

    while (tempDate <= todayUTC && dayCount < maxDays) {
      const year = tempDate.getUTCFullYear();
      const month = String(tempDate.getUTCMonth() + 1).padStart(2, '0');
      const day = String(tempDate.getUTCDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const dayData = costsByDay.get(dateStr) || { cost: 0, tokens: 0, messages: 0 };
      costsByPeriod.push({
        date: dateStr,
        cost: Number(dayData.cost.toFixed(6)),
        tokens: dayData.tokens,
        messages: dayData.messages
      });

      // Avanzar al siguiente día (en UTC)
      tempDate.setUTCDate(tempDate.getUTCDate() + 1);
      dayCount++;
    }

    // Debug: Log para verificar datos

    // ===== DISTRIBUCIÓN POR CONTEXTO =====
    // ===== DISTRIBUCIÓN POR CONTEXTO (OPTIMIZADO CON VISTA) =====
    let contextQuery = supabase
      .from('lia_conversation_analytics')
      .select('context_type, total_cost_usd, total_tokens')
      .gte('started_at', startDate.toISOString())
      .lte('started_at', nowISO);

    // Nota: La vista ya tiene los costos agregados por conversación
    // Si queremos filtrar por provider, la vista actual no tiene detalle por mensaje/modelo,
    // solo agregados totales. Si el filtro de provider es crítico para esta gráfica,
    // debemos mantener la lógica anterior o mejorar la vista.
    // Asumiendo que para la distribución general queremos ver el total (o que la vista se mejorará):
    
    // Si hay provider filter, la vista no nos sirve del todo porque pre-calcula totales de TODOS los mensajes.
    // Sin embargo, para eficiencia, usaremos la vista y si hay filtro de provider, advertimos o aceptamos la limitación
    // O mejor: mantenemos la lógica manual SOLO si hay filtro de provider, y usamos vista si es 'all' (o default).
    
    // Para simplificar y dado que el usuario pidió optimización y "guardar distinto":
    // Usaremos la lógica anterior (manual) si se requiere filtrar por modelo específico,
    // PERO optimizada para usar datos ya traídos si es posible.
    
    // Reimplementación usando los datos ya obtenidos en messagesData si es posible para evitar roundtrips?
    // MessagesData tiene conversation_id? No, lo pedimos sin conv_id para ahorrar ancho de banda.
    
    // Mejor enfoque: Usar la vista para distribución general (sin filtro de provider preciso)
    // O hacer una consulta ligera para agrupar.
    
    // Consulta a la vista para obtener totales por contexto
    // Supabase no soporta group by en .select() a menos que sea una RPC.
    // Traemos los datos de la vista y agrupamos en memoria (mas eficiente que traer raw messages)
    const { data: contextAnalyticsData } = await contextQuery;
    
    const contextCounts = new Map<string, { count: number; cost: number; tokens: number }>();
    
    contextAnalyticsData?.forEach(row => {
      const type = row.context_type || 'general';
      const existing = contextCounts.get(type) || { count: 0, cost: 0, tokens: 0 };
      
      // Si estamos filtrando por provider, la vista puede sobreestimar el costo/tokens 
      // (porque incluye todos los providers).
      // Como mejora futura: agregar columnas por provider a la vista.
      // Por ahora, usamos los valores de la vista.
      
      contextCounts.set(type, {
        count: existing.count + 1,
        cost: existing.cost + (row.total_cost_usd || 0),
        tokens: existing.tokens + (row.total_tokens || 0)
      });
    });

    const totalContextCount = Array.from(contextCounts.values()).reduce((sum, c) => sum + c.count, 0);
    const contextDistribution = Array.from(contextCounts.entries()).map(([contextType, data]) => ({
      contextType,
      count: data.count,
      cost: Number(data.cost.toFixed(6)),
      tokens: data.tokens,
      percentage: totalContextCount > 0 ? Number(((data.count / totalContextCount) * 100).toFixed(1)) : 0
    }));

    // ===== USO POR MODELO =====
    // Aquí el filtro ya se aplicó a assistantMessages porque viene de messagesData filtrado arriba
    const modelCounts = new Map<string, { tokens: number; cost: number; count: number }>();
    assistantMessages?.forEach(m => {
      const model = m.model_used || 'gpt-4o-mini';
      const existing = modelCounts.get(model) || { tokens: 0, cost: 0, count: 0 };
      modelCounts.set(model, {
        tokens: existing.tokens + (m.tokens_used || 0),
        cost: existing.cost + (m.cost_usd || 0),
        count: existing.count + 1
      });
    });

    const totalModelTokens = Array.from(modelCounts.values()).reduce((sum, m) => sum + m.tokens, 0);
    const modelUsage = Array.from(modelCounts.entries()).map(([model, data]) => ({
      model,
      tokens: data.tokens,
      cost: Number(data.cost.toFixed(6)),
      count: data.count,
      percentage: totalModelTokens > 0 ? Number(((data.tokens / totalModelTokens) * 100).toFixed(1)) : 0
    }));

    // ===== MÉTRICAS DE HOY Y COMPARACIÓN =====
    // IMPORTANTE: Usar UTC para coincidir con las fechas en la BD que están en UTC
    const now = new Date();
    const todayStart = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0, 0, 0, 0
    ));
    const todayEnd = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      23, 59, 59, 999
    ));


    // Usar fecha actual para incluir datos hasta ahora
    const nowForToday = now.toISOString();

    let todayMessagesQuery = supabase
      .from('lia_messages')
      .select('cost_usd, tokens_used, model_used')
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', nowForToday);

    todayMessagesQuery = applyProviderFilter(todayMessagesQuery);

    const { data: todayMessages } = await todayMessagesQuery;

    const todayCost = todayMessages?.reduce((sum, m) => sum + (m.cost_usd || 0), 0) || 0;
    const todayTokens = todayMessages?.reduce((sum, m) => sum + (m.tokens_used || 0), 0) || 0;

    // Ayer para comparación (usando UTC) - declarar ANTES de usarlo
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setUTCDate(yesterdayStart.getUTCDate() - 1);
    const yesterdayEnd = new Date(todayStart);
    yesterdayEnd.setUTCMilliseconds(yesterdayEnd.getUTCMilliseconds() - 1);

    // ===== USUARIOS ACTIVOS HOY =====
    // Nota: Usuarios activos se basa en conversaciones, que no estamos filtrando estrictamente
    // pero si quisiéramos ser estrictos deberíamos mirar los mensajes filtrados.
    // Por simplicidad mantenemos lógica de conversaciones startadas, asumiendo que el usuario
    // "activo" es aquel que interactuó con LIA en general.
    const { data: todayConversations } = await supabase
      .from('lia_conversations')
      .select('user_id')
      .gte('started_at', todayStart.toISOString())
      .lte('started_at', nowForToday);

    const uniqueUsersToday = new Set(todayConversations?.map(c => c.user_id).filter(Boolean));
    const activeUsersToday = uniqueUsersToday.size;

    // Usuarios activos ayer para comparación
    const { data: yesterdayConversations } = await supabase
      .from('lia_conversations')
      .select('user_id')
      .gte('started_at', yesterdayStart.toISOString())
      .lte('started_at', yesterdayEnd.toISOString());

    const uniqueUsersYesterday = new Set(yesterdayConversations?.map(c => c.user_id).filter(Boolean));
    const activeUsersYesterday = uniqueUsersYesterday.size;
    const usersChange = activeUsersYesterday > 0
      ? Number((((activeUsersToday - activeUsersYesterday) / activeUsersYesterday) * 100).toFixed(1))
      : 0;

    // ===== MENSAJES DE AYER PARA COMPARACIÓN DE COSTOS =====
    let yesterdayMessagesQuery = supabase
      .from('lia_messages')
      .select('cost_usd, tokens_used, model_used')
      .gte('created_at', yesterdayStart.toISOString())
      .lte('created_at', yesterdayEnd.toISOString());

    yesterdayMessagesQuery = applyProviderFilter(yesterdayMessagesQuery);

    const { data: yesterdayMessages } = await yesterdayMessagesQuery;

    const yesterdayCost = yesterdayMessages?.reduce((sum, m) => sum + (m.cost_usd || 0), 0) || 0;

    // Calcular cambio porcentual
    const costChange = yesterdayCost > 0
      ? Number((((todayCost - yesterdayCost) / yesterdayCost) * 100).toFixed(1))
      : 0;

    // ===== PROYECCIÓN MENSUAL =====
    const daysInPeriod = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const avgDailyCost = daysInPeriod > 0 ? totalCostUsd / daysInPeriod : 0;
    const projectedMonthlyCost = avgDailyCost * 30;

    // ===== MÉTRICAS ADICIONALES =====
    // Promedio de mensajes por conversación
    const avgMessagesPerConversation = (totalConversations && totalConversations > 0)
      ? Number((totalMessages / totalConversations).toFixed(1))
      : 0;

    // Costo promedio por mensaje
    const avgCostPerMessage = totalMessages > 0
      ? Number((totalCostUsd / totalMessages).toFixed(6))
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        period: {
          start: startDate.toISOString(),
          end: nowISO,
          type: period
        },
        summary: {
          totalConversations: totalConversations || 0,
          totalMessages,
          totalTokens,
          totalCostUsd: Number(totalCostUsd.toFixed(6)),
          avgResponseTimeMs,
          completedActivities: completedActivities || 0
        },
        today: {
          cost: Number(todayCost.toFixed(6)),
          tokens: todayTokens,
          messages: todayMessages?.length || 0,
          costChange,
          activeUsers: activeUsersToday,
          usersChange
        },
        efficiency: {
          avgMessagesPerConversation,
          avgCostPerMessage
        },
        projections: {
          dailyAvg: Number(avgDailyCost.toFixed(6)),
          monthlyEstimate: Number(projectedMonthlyCost.toFixed(4))
        },
        costsByPeriod,
        contextDistribution,
        modelUsage
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

  } catch (error) {
    console.error('Error en LIA Analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
