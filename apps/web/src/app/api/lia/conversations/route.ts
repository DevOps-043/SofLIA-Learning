import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { createAdminClient } from '@/lib/supabase/admin';
import { SessionService } from '@/features/auth/services/session.service';
import {
  conversationsPatchSchema,
  type ConversationsPatchBody,
} from '../_schemas';

interface LiaConversationRow {
  conversation_id: string;
  conversation_title?: string | null;
  context_type?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  total_messages?: number | null;
  course_id?: string | null;
  lesson_id?: string | null;
  courses?: {
    slug?: string | null;
    title?: string | null;
  } | null;
}

/**
 * GET /api/lia/conversations
 * Obtiene el historial de conversaciones de Lia para el usuario actual
 * 
 * Parámetros de query:
 * - limit: número de conversaciones a retornar (default: 20)
 * - offset: número de conversaciones a omitir (default: 0)
 * - courseSlug: filtrar por curso específico (opcional)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const courseSlug = searchParams.get('courseSlug');

    // Si se especifica courseSlug, obtener el course_id primero
    let courseId: string | null = null;
    if (courseSlug) {
      const { data: course } = await supabase
        .from('courses')
        .select('id')
        .eq('slug', courseSlug)
        .single();

      if (course) {
        courseId = course.id;
      }
    }

    // Construir query base para contar total (necesario para paginación)
    // lia_conversations no tiene columna `id`; su PK es conversation_id (42703 si se pide)
    let countQuery = supabase
      .from('lia_conversations')
      .select('conversation_id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Construir query base para obtener conversaciones
    // IMPORTANTE: Filtrar por context_type='course' cuando se especifica courseSlug
    // Esto separa las conversaciones de talleres de las conversaciones generales
    let query = supabase
      .from('lia_conversations')
      .select(`
        conversation_id,
        conversation_title,
        context_type,
        started_at,
        ended_at,
        total_messages,
        course_id,
        lesson_id,
        courses:course_id (
          slug,
          title
        )
      `)
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filtrar por curso si se especifica
    // IMPORTANTE: Solo mostrar conversaciones de tipo 'course' cuando se está en un taller
    // Esto evita mezclar conversaciones generales con las de talleres
    if (courseId) {
      // Filtrar por context_type='course' Y (course_id específico O null)
      query = query
        .eq('context_type', 'course')
        .or(`course_id.eq.${courseId},course_id.is.null`);
      countQuery = countQuery
        .eq('context_type', 'course')
        .or(`course_id.eq.${courseId},course_id.is.null`);
    } else {
      // Si no hay courseSlug, solo mostrar conversaciones del chat general
      // IMPORTANTE: Usar filtrado positivo para evitar mezclar con otros contextos
      query = query.eq('context_type', 'general');
      countQuery = countQuery.eq('context_type', 'general');
    }

    // Obtener total de conversaciones para paginación
    let totalCount = 0;
    const { count, error: countError } = await countQuery;
    if (!countError) {
      totalCount = count || 0;
    }

    const { data: conversations, error } = await query;

    if (error) {
      techDebtLogger.error('Error obteniendo conversaciones:', error);
      
      // Si el error es por columna no encontrada, intentar sin conversation_title
      if (error.message?.includes('conversation_title') || error.message?.includes('column') || error.code === '42703') {
        // Reintentar sin conversation_title
        let retryQuery = supabase
          .from('lia_conversations')
          .select(`
            conversation_id,
            context_type,
            started_at,
            ended_at,
            total_messages,
            course_id,
            lesson_id,
            courses:course_id (
              slug,
              title
            )
          `)
          .eq('user_id', user.id)
          .order('started_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (courseId) {
          retryQuery = retryQuery
            .eq('context_type', 'course')
            .or(`course_id.eq.${courseId},course_id.is.null`);
        } else {
          // Solo mostrar conversaciones del chat general
          retryQuery = retryQuery.eq('context_type', 'general');
        }

        const { data: retryConversations, error: retryError } = await retryQuery;

        if (retryError) {
          techDebtLogger.error('Error obteniendo conversaciones (sin conversation_title):', retryError);
          return NextResponse.json(
            { error: 'Error obteniendo conversaciones' },
            { status: 500 }
          );
        }

        // Formatear sin conversation_title
        const formattedConversations = ((retryConversations || []) as LiaConversationRow[]).map((conv) => ({
          conversation_id: conv.conversation_id,
          conversation_title: null,
          context_type: conv.context_type,
          started_at: conv.started_at,
          ended_at: conv.ended_at,
          total_messages: conv.total_messages || 0,
          course_id: conv.course_id,
          lesson_id: conv.lesson_id,
          course: conv.courses ? {
            slug: conv.courses.slug,
            title: conv.courses.title
          } : null
        }));

        return NextResponse.json({ 
          conversations: formattedConversations,
          pagination: {
            total: totalCount,
            limit,
            offset,
            hasMore: offset + limit < totalCount
          }
        });
      }

      return NextResponse.json(
        { error: 'Error obteniendo conversaciones' },
        { status: 500 }
      );
    }

    // Formatear conversaciones para el frontend
    // conversation_title puede no existir aún en la BD
    const formattedConversations = ((conversations || []) as LiaConversationRow[]).map((conv) => ({
      conversation_id: conv.conversation_id,
      conversation_title: conv.conversation_title ?? null,
      context_type: conv.context_type,
      started_at: conv.started_at,
      ended_at: conv.ended_at,
      total_messages: conv.total_messages || 0,
      course_id: conv.course_id,
      lesson_id: conv.lesson_id,
      course: conv.courses ? {
        slug: conv.courses.slug,
        title: conv.courses.title
      } : null
    }));

    return NextResponse.json({ 
      conversations: formattedConversations,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });
  } catch (error) {
    techDebtLogger.error('Error en API de conversaciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

async function handlePatch(
  _request: NextRequest,
  body: ConversationsPatchBody,
  _context: unknown,
) {
  try {
    const user = await SessionService.getCurrentUser();
    if (!user) {
      return apiError('UNAUTHENTICATED', 'No autenticado', 401);
    }

    const { conversationId, title } = body;

    const supabase = createAdminClient();
    
    // Verificar propiedad
    const { data: conversation } = await supabase
        .from('lia_conversations')
        .select('conversation_id')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .single();
        
    if (!conversation) {
        return apiError('CONVERSATION_NOT_FOUND', 'Conversación no encontrada', 404);
    }

    // Actualizar
    const { error } = await supabase
        .from('lia_conversations')
        .update({ conversation_title: title })
        .eq('conversation_id', conversationId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
      techDebtLogger.error('Error updating conversation:', error);
      return apiError(
        'CONVERSATION_UPDATE_FAILED',
        'Error actualizando conversación',
        500,
      );
  }
}

export const PATCH = withZodBody(conversationsPatchSchema, handlePatch);
