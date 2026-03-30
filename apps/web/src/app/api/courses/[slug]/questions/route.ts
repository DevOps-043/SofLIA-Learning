import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';
import { withCacheHeaders, cacheHeaders } from '@/lib/utils/cache-headers';

/**
 * GET /api/courses/[slug]/questions
 * Obtiene todas las preguntas de un curso
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    // Obtener el curso por slug
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', slug)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }

    // Obtener parámetros de query para filtros
    const { searchParams } = new URL(request.url);
    const isResolved = searchParams.get('resolved');
    const isPinned = searchParams.get('pinned');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Construir query base
    let query = supabase
      .from('course_questions')
      .select(`
        *,
        user:users!course_questions_user_id_fkey(
          id,
          username,
          display_name,
          first_name,
          last_name,
          profile_picture_url
        )
      `)
      .eq('course_id', course.id)
      .eq('is_hidden', false)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Aplicar filtros
    if (isResolved === 'true') {
      query = query.eq('is_resolved', true);
    } else if (isResolved === 'false') {
      query = query.eq('is_resolved', false);
    }

    if (isPinned === 'true') {
      query = query.eq('is_pinned', true);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    const { data: questions, error: questionsError } = await query;

    if (questionsError) {
      return NextResponse.json(
        { error: 'Error al obtener preguntas' },
        { status: 500 }
      );
    }

    // OPTIMIZACIÓN CRÍTICA: Paralelizar todas las queries para reducir latencia
    if (questions && questions.length > 0) {
      const questionIds = questions.map((q: any) => q.id);

      // Obtener usuario actual primero
      const currentUser = await SessionService.getCurrentUser();

      // PARALELIZAR: Ejecutar response counts + user reactions simultáneamente
      const queries = [
        supabase
          .from('course_question_responses')
          .select('question_id')
          .in('question_id', questionIds)
          .eq('is_deleted', false)
      ];

      // Si hay usuario, agregar query de reacciones
      if (currentUser) {
        queries.push(
          supabase
            .from('course_question_reactions')
            .select('question_id, reaction_type')
            .eq('user_id', currentUser.id)
            .in('question_id', questionIds)
        );
      }

      // Ejecutar queries en paralelo
      const results = await Promise.all(queries);
      const responseCountsResult = results[0];
      const userReactionsResult = currentUser ? results[1] : null;

      // Crear un mapa de conteos: questionId -> count
      const countsMap = new Map<string, number>();
      if (responseCountsResult.data && !responseCountsResult.error) {
        responseCountsResult.data.forEach((response: any) => {
          const questionId = response.question_id;
          countsMap.set(questionId, (countsMap.get(questionId) || 0) + 1);
        });
      }

      // Procesar reacciones del usuario
      let userReactionsMap = new Map<string, string>();
      if (userReactionsResult && userReactionsResult.data) {
        userReactionsResult.data.forEach((reaction: any) => {
          userReactionsMap.set(reaction.question_id, reaction.reaction_type);
        });
      }

      // Aplicar conteos y reacciones a las preguntas
      const questionsWithCounts = questions.map((question: any) => ({
        ...question,
        response_count: countsMap.get(question.id) || question.response_count || 0,
        user_reaction: userReactionsMap.get(question.id) || null
      }));

      // ⚡ OPTIMIZACIÓN: Sin caché para datos en tiempo real (realtime subscriptions)
      // El caché causaba delays en mostrar nuevas preguntas/respuestas/reacciones
      return withCacheHeaders(
        NextResponse.json(questionsWithCounts || []),
        cacheHeaders.noCache
      );
    }

    // ⚡ OPTIMIZACIÓN: Sin caché para datos en tiempo real
    return withCacheHeaders(
      NextResponse.json(questions || []),
      cacheHeaders.noCache
    );
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/courses/[slug]/questions
 * Crea una nueva pregunta en el curso
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    // Obtener usuario actual
    const user = await SessionService.getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener el curso por slug
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', slug)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }

    // Obtener datos del body
    const body = await request.json();
    const { title, content, tags, attachment_url, attachment_type, attachment_data } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'El contenido de la pregunta es requerido' },
        { status: 400 }
      );
    }

    // Crear la pregunta
    const { data: question, error: questionError } = await supabase
      .from('course_questions')
      .insert({
        course_id: course.id,
        user_id: user.id,
        title: title?.trim() || null,
        content: content.trim(),
        tags: tags || [],
        attachment_url: attachment_url || null,
        attachment_type: attachment_type || null,
        attachment_data: attachment_data || {}
      })
      .select(`
        *,
        user:users!course_questions_user_id_fkey(
          id,
          username,
          display_name,
          first_name,
          last_name,
          profile_picture_url
        )
      `)
      .single();

    if (questionError) {
      return NextResponse.json(
        { error: 'Error al crear pregunta' },
        { status: 500 }
      );
    }

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

