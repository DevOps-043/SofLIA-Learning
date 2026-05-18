import { logger as techDebtLogger } from '@/lib/utils/logger'
/**
 * API de LIA Analytics - Top Questions/Temas Frecuentes
 * 
 * Analiza los mensajes de usuarios para identificar temas y preguntas frecuentes
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

// Patrones para categorizar preguntas
const CATEGORY_PATTERNS: Record<string, RegExp[]> = {
  course: [
    /curso/i, /lección/i, /módulo/i, /tema/i, /capítulo/i, /contenido/i,
    /aprender/i, /estudiar/i, /clase/i, /material/i
  ],
  activity: [
    /actividad/i, /ejercicio/i, /práctica/i, /tarea/i, /quiz/i,
    /evaluación/i, /respuesta/i, /completar/i, /resolver/i
  ],
  technical: [
    /error/i, /problema/i, /no funciona/i, /bug/i, /falla/i,
    /ayuda/i, /cómo puedo/i, /no puedo/i, /no me deja/i
  ],
  concept: [
    /qué es/i, /qué significa/i, /definición/i, /concepto/i, /explica/i,
    /por qué/i, /cómo funciona/i, /diferencia/i, /ejemplo/i
  ],
  general: [
    /hola/i, /buenos días/i, /gracias/i, /ayuda/i
  ]
};

function categorizeMessage(content: string): string {
  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(content)) {
        return category;
      }
    }
  }
  return 'other';
}

function detectSentiment(content: string): 'positive' | 'neutral' | 'negative' {
  const positiveWords = /gracias|excelente|perfecto|genial|increíble|entendí|claro|bien|👍|😊|🙏/i;
  const negativeWords = /no entiendo|confundido|difícil|problema|error|mal|no funciona|frustrado|😕|😢/i;
  
  if (positiveWords.test(content)) return 'positive';
  if (negativeWords.test(content)) return 'negative';
  return 'neutral';
}

// Extraer el tema principal de un mensaje
function extractTopic(content: string): string {
  // Limpiar y truncar el mensaje
  let topic = content
    .replace(/[¿?¡!.,;:()[\]{}]/g, '')
    .trim()
    .slice(0, 80);
  
  // Capitalizar primera letra
  if (topic.length > 0) {
    topic = topic.charAt(0).toUpperCase() + topic.slice(1);
  }
  
  return topic || 'Pregunta general';
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    const limit = parseInt(searchParams.get('limit') || '10');

    const { startDate, endDate } = getDateRange(period);

    // Obtener mensajes de usuarios (no del asistente)
    const { data: messages, error } = await supabase
      .from('lia_messages')
      .select('content, response_time_ms, created_at')
      .eq('role', 'user')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      techDebtLogger.error('Error fetching messages for top questions:', error);
      return NextResponse.json(
        { success: false, error: 'Error al obtener datos' },
        { status: 500 }
      );
    }

    // Agrupar y contar temas similares
    const topicCounts: Map<string, {
      count: number;
      category: string;
      totalResponseTime: number;
      sentiments: { positive: number; neutral: number; negative: number };
      originalContent: string;
    }> = new Map();

    const categoryCounter: Record<string, number> = {};

    messages?.forEach(msg => {
      if (!msg.content || msg.content.length < 5) return;

      const topic = extractTopic(msg.content);
      const category = categorizeMessage(msg.content);
      const sentiment = detectSentiment(msg.content);

      // Contar categorías
      categoryCounter[category] = (categoryCounter[category] || 0) + 1;

      // Buscar tema similar existente o crear nuevo
      let foundSimilar = false;
      for (const [existingTopic, data] of topicCounts.entries()) {
        // Comparación simple de similitud (primeras 30 caracteres)
        if (existingTopic.slice(0, 30).toLowerCase() === topic.slice(0, 30).toLowerCase()) {
          data.count++;
          data.totalResponseTime += msg.response_time_ms || 0;
          data.sentiments[sentiment]++;
          foundSimilar = true;
          break;
        }
      }

      if (!foundSimilar) {
        topicCounts.set(topic, {
          count: 1,
          category,
          totalResponseTime: msg.response_time_ms || 0,
          sentiments: {
            positive: sentiment === 'positive' ? 1 : 0,
            neutral: sentiment === 'neutral' ? 1 : 0,
            negative: sentiment === 'negative' ? 1 : 0
          },
          originalContent: msg.content
        });
      }
    });

    // Convertir a array y ordenar por frecuencia
    const sortedTopics = Array.from(topicCounts.entries())
      .map(([question, data]) => ({
        question,
        count: data.count,
        category: data.category,
        avgResponseTime: data.count > 0 ? Math.round(data.totalResponseTime / data.count) : 0,
        sentiment: data.sentiments.positive > data.sentiments.negative 
          ? 'positive' as const
          : data.sentiments.negative > data.sentiments.positive 
            ? 'negative' as const
            : 'neutral' as const
      }))
      .filter(t => t.count >= 2) // Solo mostrar temas con al menos 2 ocurrencias
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    // Encontrar categoría más frecuente
    const topCategory = Object.entries(categoryCounter)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    return NextResponse.json({
      success: true,
      data: {
        questions: sortedTopics,
        totalQuestions: messages?.length || 0,
        topCategory,
        categoryCounts: categoryCounter,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      }
    });

  } catch (error) {
    techDebtLogger.error('Error en LIA Analytics Top Questions:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
