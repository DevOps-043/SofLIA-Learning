import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { SessionService } from '@/features/auth/services/session.service';
import { PurchasedCoursesService } from '@/features/courses/services/purchased-courses.service';
import { cacheGet, cacheSet } from '@/lib/cache/ttlCache';

const MY_COURSES_CACHE_TTL_MS = 15_000;

type MyCoursesApiResponse = Awaited<ReturnType<typeof PurchasedCoursesService.getUserPurchasedCourses>>;
type MyCoursesStatsResponse = Awaited<ReturnType<typeof PurchasedCoursesService.getUserLearningStats>>;

function myCoursesCacheKey(userId: string, statsOnly: boolean) {
  return `api:my-courses:${statsOnly ? 'stats' : 'list'}:${userId}`;
}

/**
 * GET /api/my-courses
 * Obtiene todos los cursos comprados por el usuario autenticado
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener usuario usando el sistema de sesiones
    const currentUser = await SessionService.getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener parámetros opcionales
    const { searchParams } = new URL(request.url);
    const statsOnly = searchParams.get('stats_only') === 'true';
    const cacheKey = myCoursesCacheKey(currentUser.id, statsOnly);
    const cached = cacheGet<MyCoursesApiResponse | MyCoursesStatsResponse>(cacheKey);

    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'private, max-age=15, stale-while-revalidate=30',
        },
      });
    }

    if (statsOnly) {
      // Retornar solo estadísticas
      const stats = await PurchasedCoursesService.getUserLearningStats(currentUser.id);
      cacheSet(cacheKey, stats, MY_COURSES_CACHE_TTL_MS);
      return NextResponse.json(stats, {
        headers: {
          // Cache privado de 60 segundos, permite stale de 30s adicionales
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=30',
        },
      });
    }

    // Obtener cursos comprados
    const courses = await PurchasedCoursesService.getUserPurchasedCourses(currentUser.id);
    cacheSet(cacheKey, courses, MY_COURSES_CACHE_TTL_MS);

    return NextResponse.json(courses, {
      headers: {
        // Cache privado de 60 segundos, permite stale de 30s adicionales
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    logger.error('Error in my-courses API:', error);
    return NextResponse.json(
      { 
        error: 'Error al obtener tus cursos',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
