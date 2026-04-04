/**
 * Learning Route Service
 * Sugiere rutas de aprendizaje estructuradas basadas en los cursos del usuario
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server';
import { CourseWithProgress } from './user-context.service';

// Tipos para rutas de aprendizaje
export interface LearningRouteItem {
  courseId: string;
  title: string;
  level: 'beginner' | 'intermediate' | 'advanced' | null;
  category: string | null;
  order: number;
  isRequired: boolean;
  isOwned: boolean;
  currentProgress: number;
  estimatedMinutes: number;
  reason: string;
}

export interface LearningRoute {
  name: string;
  description: string;
  items: LearningRouteItem[];
  totalMinutes: number;
  totalCourses: number;
  completedCourses: number;
  estimatedWeeks: number;
}

export interface SuggestedRoute {
  route: LearningRoute;
  suggestedCourses: SuggestedCourse[];
  warnings: string[];
  tips: string[];
}

export interface SuggestedCourse {
  courseId: string;
  title: string;
  level: string | null;
  category: string | null;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

// Orden de niveles para sorting
const LEVEL_ORDER: Record<string, number> = {
  'beginner': 1,
  'intermediate': 2,
  'advanced': 3
};

export class LearningRouteService {
  /**
   * Genera una ruta de aprendizaje sugerida basada en los cursos del usuario
   */
  static async suggestLearningRoute(
    userCourses: CourseWithProgress[],
    focusCourseIds?: string[]
  ): Promise<SuggestedRoute> {
    const supabase = await createClient();
    const warnings: string[] = [];
    const tips: string[] = [];

    // Filtrar cursos a considerar
    let coursesToConsider = userCourses;
    if (focusCourseIds && focusCourseIds.length > 0) {
      coursesToConsider = userCourses.filter(c => focusCourseIds.includes(c.course_id));
    }

    // Si no hay cursos, retornar ruta vacía
    if (coursesToConsider.length === 0) {
      return {
        route: {
          name: 'Ruta de Aprendizaje',
          description: 'No tienes cursos seleccionados para crear una ruta.',
          items: [],
          totalMinutes: 0,
          totalCourses: 0,
          completedCourses: 0,
          estimatedWeeks: 0
        },
        suggestedCourses: [],
        warnings: ['No se encontraron cursos para crear una ruta de aprendizaje.'],
        tips: ['Adquiere algunos cursos para comenzar tu ruta de aprendizaje.']
      };
    }

    // Ordenar cursos por nivel y progreso
    const sortedCourses = this.sortCoursesByLevelAndProgress(coursesToConsider);

    // Crear items de la ruta
    const routeItems: LearningRouteItem[] = sortedCourses.map((course, index) => ({
      courseId: course.course_id,
      title: course.title,
      level: course.level,
      category: course.category,
      order: index + 1,
      isRequired: true,
      isOwned: true,
      currentProgress: course.progress_percentage,
      estimatedMinutes: course.duration_total_minutes || 60, // Default 60 min si no hay datos
      reason: this.getCourseReason(course, index, sortedCourses)
    }));

    // Calcular estadísticas
    const totalMinutes = routeItems.reduce((sum, item) => sum + item.estimatedMinutes, 0);
    const completedCourses = routeItems.filter(item => item.currentProgress >= 100).length;
    
    // Estimar semanas (asumiendo 3-4 horas/semana)
    const estimatedWeeks = Math.ceil(totalMinutes / (3.5 * 60));

    // Generar tips basados en la ruta
    tips.push(...this.generateTips(routeItems));

    // Buscar cursos sugeridos complementarios
    const suggestedCourses = await this.findComplementaryCourses(
      coursesToConsider,
      supabase
    );

    // Generar warnings
    warnings.push(...this.generateWarnings(routeItems));

    return {
      route: {
        name: this.generateRouteName(sortedCourses),
        description: this.generateRouteDescription(sortedCourses),
        items: routeItems,
        totalMinutes,
        totalCourses: routeItems.length,
        completedCourses,
        estimatedWeeks
      },
      suggestedCourses,
      warnings,
      tips
    };
  }

  /**
   * Ordena cursos por nivel y progreso
   */
  private static sortCoursesByLevelAndProgress(courses: CourseWithProgress[]): CourseWithProgress[] {
    return [...courses].sort((a, b) => {
      // Primero por nivel
      const levelA = LEVEL_ORDER[a.level || 'intermediate'] || 2;
      const levelB = LEVEL_ORDER[b.level || 'intermediate'] || 2;
      
      if (levelA !== levelB) return levelA - levelB;

      // Luego por progreso (los que ya empezaste primero)
      if (a.progress_percentage > 0 && b.progress_percentage === 0) return -1;
      if (b.progress_percentage > 0 && a.progress_percentage === 0) return 1;

      // Finalmente por título
      return a.title.localeCompare(b.title);
    });
  }

  /**
   * Genera la razón por la cual un curso está en cierta posición
   */
  private static getCourseReason(
    course: CourseWithProgress,
    index: number,
    allCourses: CourseWithProgress[]
  ): string {
    if (course.progress_percentage >= 100) {
      return 'Ya completado - incluido para referencia';
    }

    if (course.progress_percentage > 0) {
      return `En progreso (${course.progress_percentage}%) - prioritario para continuar`;
    }

    const level = course.level || 'intermediate';
    
    if (index === 0) {
      return `Curso de nivel ${this.getLevelName(level)} - punto de partida recomendado`;
    }

    const prevCourse = allCourses[index - 1];
    if (prevCourse && prevCourse.level !== course.level) {
      return `Avance a nivel ${this.getLevelName(level)} después de completar los fundamentos`;
    }

    return `Curso ${this.getLevelName(level)} complementario`;
  }

  /**
   * Obtiene el nombre del nivel en español
   */
  private static getLevelName(level: string): string {
    const names: Record<string, string> = {
      'beginner': 'básico',
      'intermediate': 'intermedio',
      'advanced': 'avanzado'
    };
    return names[level] || level;
  }

  /**
   * Genera el nombre de la ruta basado en los cursos
   */
  private static generateRouteName(courses: CourseWithProgress[]): string {
    // Obtener categorías únicas
    const categories = [...new Set(courses.map(c => c.category).filter(Boolean))];
    
    if (categories.length === 1) {
      return `Ruta de ${categories[0]}`;
    } else if (categories.length <= 3) {
      return `Ruta de ${categories.join(' y ')}`;
    }
    
    return 'Ruta de Aprendizaje Personalizada';
  }

  /**
   * Genera la descripción de la ruta
   */
  private static generateRouteDescription(courses: CourseWithProgress[]): string {
    const levels = [...new Set(courses.map(c => c.level).filter(Boolean))];
    const hasAllLevels = levels.includes('beginner') && levels.includes('advanced');

    if (hasAllLevels) {
      return 'Una ruta completa que te llevará desde los fundamentos hasta técnicas avanzadas.';
    }

    if (levels.includes('beginner')) {
      return 'Ruta enfocada en establecer bases sólidas de conocimiento.';
    }

    if (levels.includes('advanced')) {
      return 'Ruta avanzada para profundizar en temas especializados.';
    }

    return 'Ruta personalizada basada en tus cursos seleccionados.';
  }

  /**
   * Genera tips basados en la ruta
   */
  private static generateTips(items: LearningRouteItem[]): string[] {
    const tips: string[] = [];

    // Tip sobre cursos en progreso
    const inProgressCourses = items.filter(i => i.currentProgress > 0 && i.currentProgress < 100);
    if (inProgressCourses.length > 0) {
      tips.push(`Tienes ${inProgressCourses.length} curso(s) en progreso. Te recomendamos completarlos antes de iniciar nuevos.`);
    }

    // Tip sobre fundamentos
    const beginnerCourses = items.filter(i => i.level === 'beginner');
    if (beginnerCourses.length > 0 && beginnerCourses[0].currentProgress < 100) {
      tips.push('Comienza con los cursos de nivel básico para construir una base sólida.');
    }

    // Tip sobre práctica
    tips.push('Aplica lo aprendido en cada curso antes de pasar al siguiente para mejor retención.');

    return tips;
  }

  /**
   * Genera warnings basados en la ruta
   */
  private static generateWarnings(items: LearningRouteItem[]): string[] {
    const warnings: string[] = [];

    // Warning sobre saltar niveles
    const hasAdvancedWithoutBeginner = items.some(i => i.level === 'advanced') &&
      !items.some(i => i.level === 'beginner' && i.currentProgress >= 50);
    
    if (hasAdvancedWithoutBeginner) {
      warnings.push('Tienes cursos avanzados sin haber completado los básicos. Considera completar los fundamentos primero.');
    }

    // Warning sobre muchos cursos
    if (items.length > 5) {
      warnings.push('Tienes muchos cursos en tu ruta. Considera enfocarte en 3-5 para mejor concentración.');
    }

    return warnings;
  }

  /**
   * Busca cursos complementarios que el usuario podría considerar
   */
  private static async findComplementaryCourses(
    userCourses: CourseWithProgress[],
    supabase: SupabaseClient
  ): Promise<SuggestedCourse[]> {
    const suggestedCourses: SuggestedCourse[] = [];

    // Obtener categorías actuales del usuario
    const userCategories = [...new Set(userCourses.map(c => c.category).filter(Boolean))];
    const userCourseIds = userCourses.map(c => c.course_id);

    // Verificar si falta algún nivel
    const userLevels = [...new Set(userCourses.map(c => c.level).filter(Boolean))];
    const missingLevels: string[] = [];
    
    if (!userLevels.includes('beginner')) missingLevels.push('beginner');
    if (!userLevels.includes('intermediate') && userLevels.includes('advanced')) {
      missingLevels.push('intermediate');
    }

    // Buscar cursos de niveles faltantes en las mismas categorías
    if (missingLevels.length > 0 && userCategories.length > 0) {
      const { data: complementaryCourses } = await supabase
        .from('courses')
        .select('id, title, level, category')
        .in('category', userCategories)
        .in('level', missingLevels)
        .not('id', 'in', `(${userCourseIds.join(',')})`)
        .eq('status', 'published')
        .limit(3);

      if (complementaryCourses) {
        for (const course of complementaryCourses) {
          suggestedCourses.push({
            courseId: course.id,
            title: course.title,
            level: course.level,
            category: course.category,
            reason: `Curso de nivel ${this.getLevelName(course.level)} para complementar tu ruta de ${course.category}`,
            priority: missingLevels.includes('beginner') ? 'high' : 'medium'
          });
        }
      }
    }

    return suggestedCourses;
  }

  /**
   * Reorganiza la ruta según preferencias del usuario
   */
  static reorganizeRoute(
    route: LearningRoute,
    preferences: {
      prioritizeCourseIds?: string[];
      excludeCourseIds?: string[];
      maxCourses?: number;
    }
  ): LearningRoute {
    let items = [...route.items];

    // Excluir cursos
    if (preferences.excludeCourseIds && preferences.excludeCourseIds.length > 0) {
      items = items.filter(item => !preferences.excludeCourseIds!.includes(item.courseId));
    }

    // Priorizar cursos
    if (preferences.prioritizeCourseIds && preferences.prioritizeCourseIds.length > 0) {
      items.sort((a, b) => {
        const aPriority = preferences.prioritizeCourseIds!.includes(a.courseId) ? 0 : 1;
        const bPriority = preferences.prioritizeCourseIds!.includes(b.courseId) ? 0 : 1;
        return aPriority - bPriority;
      });
    }

    // Limitar cantidad
    if (preferences.maxCourses && preferences.maxCourses > 0) {
      items = items.slice(0, preferences.maxCourses);
    }

    // Recalcular orden
    items = items.map((item, index) => ({ ...item, order: index + 1 }));

    // Recalcular totales
    const totalMinutes = items.reduce((sum, item) => sum + item.estimatedMinutes, 0);
    const completedCourses = items.filter(item => item.currentProgress >= 100).length;
    const estimatedWeeks = Math.ceil(totalMinutes / (3.5 * 60));

    return {
      ...route,
      items,
      totalMinutes,
      totalCourses: items.length,
      completedCourses,
      estimatedWeeks
    };
  }
}

