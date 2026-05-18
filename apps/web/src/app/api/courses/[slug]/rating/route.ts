import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';

/**
 * GET /api/courses/[slug]/rating
 * Verifica si el usuario actual ya calificó el curso y retorna el rating si existe
 */
export async function GET(
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

    // Verificar si el usuario ya calificó el curso
    const { data: review, error: reviewError } = await supabase
      .from('course_reviews')
      .select('review_id, rating, review_title, review_content, created_at, updated_at')
      .eq('course_id', course.id)
      .eq('user_id', user.id)
      .single();

    if (reviewError && reviewError.code !== 'PGRST116') {
      // PGRST116 es "no rows returned", que es esperado si no hay rating
      return NextResponse.json(
        { error: 'Error al verificar rating' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      hasRating: !!review,
      rating: review || null,
    });
  } catch (error) {
    techDebtLogger.error('Error in GET /api/courses/[slug]/rating:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/courses/[slug]/rating
 * Crea o actualiza el rating de un curso (UPSERT)
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

    // Obtener datos del body
    const body = await request.json();
    const { rating, review_title, review_content } = body;

    // Validar rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'El rating debe ser un número entre 1 y 5' },
        { status: 400 }
      );
    }

    // Validar que review_content no esté vacío si se proporciona
    if (review_content !== undefined && review_content !== null && review_content.trim().length === 0) {
      return NextResponse.json(
        { error: 'El contenido de la reseña no puede estar vacío' },
        { status: 400 }
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

    // Verificar que el usuario esté inscrito en el curso
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('user_course_enrollments')
      .select('enrollment_id')
      .eq('course_id', course.id)
      .eq('user_id', user.id)
      .single();

    if (enrollmentError || !enrollment) {
      return NextResponse.json(
        { error: 'Debes estar inscrito en el curso para calificarlo' },
        { status: 403 }
      );
    }

    // Preparar datos para UPSERT
    const reviewData = {
      course_id: course.id,
      user_id: user.id,
      rating: Math.round(rating), // Asegurar que sea entero
      review_title: review_title || null,
      review_content: review_content || 'Sin comentarios', // Requerido por la BD
      updated_at: new Date().toISOString(),
    };

    // UPSERT usando ON CONFLICT (maneja la restricción UNIQUE)
    const { data: review, error: upsertError } = await supabase
      .from('course_reviews')
      .upsert(reviewData, {
        onConflict: 'course_id,user_id',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (upsertError) {
      techDebtLogger.error('Error upserting review:', upsertError);
      return NextResponse.json(
        { error: 'Error al guardar la calificación' },
        { status: 500 }
      );
    }

    // Actualizar average_rating y review_count en la tabla courses
    // Primero calcular el promedio y conteo
    const { data: allReviews, error: reviewsError } = await supabase
      .from('course_reviews')
      .select('rating')
      .eq('course_id', course.id);

    if (reviewsError) {
      techDebtLogger.error('Error fetching reviews for average:', reviewsError);
      // No fallar la operación si no podemos actualizar el promedio
    } else if (allReviews && allReviews.length > 0) {
      const averageRating = allReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / allReviews.length;
      const reviewCount = allReviews.length;

      // Actualizar el curso con el nuevo promedio y conteo
      const { error: updateError } = await supabase
        .from('courses')
        .update({
          average_rating: Math.round(averageRating * 10) / 10, // Redondear a 1 decimal
          review_count: reviewCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', course.id);

      if (updateError) {
        techDebtLogger.error('Error updating course rating stats:', updateError);
        // No fallar la operación si no podemos actualizar las estadísticas
      }
    }

    return NextResponse.json({
      success: true,
      rating: review,
      message: 'Calificación guardada exitosamente',
    });
  } catch (error) {
    techDebtLogger.error('Error in POST /api/courses/[slug]/rating:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

