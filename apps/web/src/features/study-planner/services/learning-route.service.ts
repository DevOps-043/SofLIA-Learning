import { createClient } from '@/lib/supabase/server'
import {
  buildRouteItems,
  generateRouteDescription,
  generateRouteName,
  sortCoursesByLevelAndProgress,
} from './learning-route-builder.service'
import { findComplementaryCourses } from './learning-route-complementary.service'
import {
  generateTips,
  generateWarnings,
} from './learning-route-guidance.service'
import { reorganizeLearningRoute } from './learning-route-reorganize.service'
import type {
  CourseWithProgress,
  LearningRoute,
  LearningRouteReorderPreferences,
  SuggestedRoute,
} from './learning-route.types'

export type {
  CourseWithProgress,
  LearningRoute,
  LearningRouteItem,
  LearningRouteReorderPreferences,
  SuggestedCourse,
  SuggestedRoute,
} from './learning-route.types'

export class LearningRouteService {
  static async suggestLearningRoute(
    userCourses: CourseWithProgress[],
    focusCourseIds?: string[],
  ): Promise<SuggestedRoute> {
    const supabase = await createClient()
    const coursesToConsider = focusCourseIds?.length
      ? userCourses.filter((course) => focusCourseIds.includes(course.course_id))
      : userCourses

    if (coursesToConsider.length === 0) {
      return {
        route: {
          name: 'Ruta de Aprendizaje',
          description: 'No tienes cursos seleccionados para crear una ruta.',
          items: [],
          totalMinutes: 0,
          totalCourses: 0,
          completedCourses: 0,
          estimatedWeeks: 0,
        },
        suggestedCourses: [],
        warnings: ['No se encontraron cursos para crear una ruta de aprendizaje.'],
        tips: ['Adquiere algunos cursos para comenzar tu ruta de aprendizaje.'],
      }
    }

    const sortedCourses = sortCoursesByLevelAndProgress(coursesToConsider)
    const routeItems = buildRouteItems(sortedCourses)
    const totalMinutes = routeItems.reduce((sum, item) => sum + item.estimatedMinutes, 0)

    return {
      route: {
        name: generateRouteName(sortedCourses),
        description: generateRouteDescription(sortedCourses),
        items: routeItems,
        totalMinutes,
        totalCourses: routeItems.length,
        completedCourses: routeItems.filter((item) => item.currentProgress >= 100).length,
        estimatedWeeks: Math.ceil(totalMinutes / (3.5 * 60)),
      },
      suggestedCourses: await findComplementaryCourses(coursesToConsider, supabase),
      warnings: generateWarnings(routeItems),
      tips: generateTips(routeItems),
    }
  }

  static reorganizeRoute(
    route: LearningRoute,
    preferences: LearningRouteReorderPreferences,
  ): LearningRoute {
    return reorganizeLearningRoute(route, preferences)
  }
}
