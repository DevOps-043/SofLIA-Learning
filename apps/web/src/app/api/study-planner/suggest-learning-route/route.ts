import { logger as techDebtLogger } from '@/lib/utils/logger'
/**
 * API Endpoint: Suggest Learning Route using LIA
 * 
 * POST /api/study-planner/suggest-learning-route
 * 
 * Usa LIA para sugerir rutas de aprendizaje personalizadas
 * basándose en los cursos del usuario y su perfil profesional.
 * (Solo para usuarios B2C)
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { SessionService } from '../../../../features/auth/services/session.service';
import { UserContextService } from '../../../../features/study-planner/services/user-context.service';
import { CourseAnalysisService } from '../../../../features/study-planner/services/course-analysis.service';
import type { 
  LearningRouteSuggestion,
  CourseInfo 
} from '../../../../features/study-planner/types/user-context.types';
import { generateLearningRouteSuggestions } from './suggest-learning-route.service';
import {
  suggestLearningRouteSchema,
  type SuggestLearningRouteBody,
} from '../_schemas';

interface SuggestLearningRouteResponse {
  success: boolean;
  data?: {
    suggestions: LearningRouteSuggestion[];
    userCourses: CourseInfo[];
    availableCourses?: CourseInfo[];
  };
  error?: string;
}

async function handlePost(
  _request: NextRequest,
  body: SuggestLearningRouteBody,
): Promise<NextResponse<SuggestLearningRouteResponse> | Response> {
  try {
    // Verificar autenticación
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return apiError('UNAUTHENTICATED', 'No autenticado', 401);
    }
    
    // Obtener contexto del usuario
    const userContext = await UserContextService.getFullUserContext(user.id);
    
    // Verificar que sea B2C (solo B2C puede seleccionar cursos)
    if (userContext.userType === 'b2b') {
      // Para B2B, retornar sus cursos asignados como una sola "ruta"
      const assignedCourses = userContext.courses.map(c => c.course);
      
      let totalDuration = 0;
      for (const course of assignedCourses) {
        totalDuration += course.durationTotalMinutes || 0;
      }
      
      return NextResponse.json({
        success: true,
        data: {
          suggestions: [{
            name: 'Cursos Asignados por tu Organización',
            description: 'Estos cursos han sido asignados por tu administrador y deben completarse según los plazos establecidos.',
            courses: assignedCourses,
            reason: 'Cursos obligatorios asignados por tu empresa',
            estimatedDuration: totalDuration,
            difficulty: 'intermediate',
            skills: [],
          }],
          userCourses: assignedCourses,
        },
      });
    }
    
    // Para B2C: obtener cursos propios
    const userCourses = userContext.courses.map(c => c.course);
    
    // Obtener cursos disponibles si se solicita
    let availableCourses: CourseInfo[] = [];
    if (body.includeUnpurchasedCourses) {
      availableCourses = await CourseAnalysisService.getAvailableCoursesForSuggestion(
        user.id,
        body.focusArea,
        undefined,
        body.maxCourses || 10
      );
    }
    
    // Preparar datos para LIA
    const profileData = {
      rol: userContext.professionalProfile?.rol?.nombre,
      area: userContext.professionalProfile?.area?.nombre,
      nivel: userContext.professionalProfile?.nivel?.nombre,
      sector: userContext.professionalProfile?.sector?.nombre,
    };
    
    // Generar sugerencias usando LIA
    const suggestions = await generateLearningRouteSuggestions(
      userCourses,
      availableCourses,
      profileData,
      body.focusArea,
      body.targetSkills
    );
    
    return NextResponse.json({
      success: true,
      data: {
        suggestions,
        userCourses,
        availableCourses: body.includeUnpurchasedCourses ? availableCourses : undefined,
      },
    });
    
  } catch (error) {
    techDebtLogger.error('Error sugiriendo ruta de aprendizaje:', error);
    return apiError('SUGGEST_LEARNING_ROUTE_FAILED', 'Error interno del servidor', 500);
  }
}

export const POST = withZodBody(suggestLearningRouteSchema, handlePost);

/**
 * Genera sugerencias de rutas de aprendizaje usando LIA
 */
