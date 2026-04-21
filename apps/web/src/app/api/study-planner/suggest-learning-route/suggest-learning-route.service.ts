import type { LearningRouteSuggestion, CourseInfo } from '../../../../features/study-planner/types/user-context.types';

interface UserProfileData {
  area?: string;
  [key: string]: unknown;
}

export async function generateLearningRouteSuggestions(
  userCourses: CourseInfo[],
  availableCourses: CourseInfo[],
  profileData: UserProfileData,
  focusArea?: string,
  targetSkills?: string[]
): Promise<LearningRouteSuggestion[]> {
  const suggestions: LearningRouteSuggestion[] = [];
  
  // Agrupar cursos del usuario por categoría
  const coursesByCategory = new Map<string, CourseInfo[]>();
  for (const course of userCourses) {
    const category = course.category || 'General';
    if (!coursesByCategory.has(category)) {
      coursesByCategory.set(category, []);
    }
    coursesByCategory.get(category)!.push(course);
  }
  
  // Ruta 1: Todos los cursos del usuario ordenados por dificultad
  if (userCourses.length > 0) {
    const sortedByDifficulty = [...userCourses].sort((a, b) => {
      const levels = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
      return (levels[a.level] || 2) - (levels[b.level] || 2);
    });
    
    let totalDuration = 0;
    for (const course of sortedByDifficulty) {
      totalDuration += course.durationTotalMinutes || 0;
    }
    
    suggestions.push({
      name: 'Ruta Progresiva',
      description: 'Comienza desde lo básico y avanza hacia contenido más avanzado. Ideal para construir una base sólida.',
      courses: sortedByDifficulty,
      reason: 'Ordenada de menor a mayor dificultad para un aprendizaje gradual',
      estimatedDuration: totalDuration,
      difficulty: sortedByDifficulty[0]?.level || 'beginner',
      skills: extractSkillsFromCourses(sortedByDifficulty),
    });
  }
  
  // Ruta 2: Por categoría más relevante al perfil
  if (coursesByCategory.size > 0) {
    const profileArea = (profileData.area || '').toLowerCase();
    let bestCategory = '';
    let bestCourses: CourseInfo[] = [];
    
    for (const [category, courses] of coursesByCategory) {
      if (category.toLowerCase().includes(profileArea) || 
          profileArea.includes(category.toLowerCase()) ||
          courses.length > bestCourses.length) {
        bestCategory = category;
        bestCourses = courses;
      }
    }
    
    if (bestCourses.length > 0) {
      let totalDuration = 0;
      for (const course of bestCourses) {
        totalDuration += course.durationTotalMinutes || 0;
      }
      
      suggestions.push({
        name: `Especialización en ${bestCategory}`,
        description: `Enfócate en ${bestCategory} para profundizar tus conocimientos en esta área.`,
        courses: bestCourses,
        reason: `Área relacionada con tu perfil profesional de ${profileData.area || 'tu campo'}`,
        estimatedDuration: totalDuration,
        difficulty: 'intermediate',
        skills: extractSkillsFromCourses(bestCourses),
      });
    }
  }
  
  // Ruta 3: Ruta rápida (cursos más cortos primero)
  if (userCourses.length > 0) {
    const shortestFirst = [...userCourses].sort((a, b) => 
      (a.durationTotalMinutes || 0) - (b.durationTotalMinutes || 0)
    );
    
    let totalDuration = 0;
    for (const course of shortestFirst) {
      totalDuration += course.durationTotalMinutes || 0;
    }
    
    suggestions.push({
      name: 'Ruta de Victorias Rápidas',
      description: 'Completa primero los cursos más cortos para ganar momentum y motivación.',
      courses: shortestFirst,
      reason: 'Comenzar con cursos cortos ayuda a mantener la motivación',
      estimatedDuration: totalDuration,
      difficulty: shortestFirst[0]?.level || 'beginner',
      skills: extractSkillsFromCourses(shortestFirst),
    });
  }
  
  // Ruta 4: Incluir cursos sugeridos (solo si hay cursos disponibles)
  if (availableCourses.length > 0 && userCourses.length > 0) {
    // Combinar algunos cursos del usuario con sugerencias
    const combinedCourses = [
      ...userCourses.slice(0, 2),
      ...availableCourses.slice(0, 3),
    ];
    
    let totalDuration = 0;
    for (const course of combinedCourses) {
      totalDuration += course.durationTotalMinutes || 0;
    }
    
    suggestions.push({
      name: 'Ruta Expandida',
      description: 'Complementa tus cursos actuales con nuevas oportunidades de aprendizaje.',
      courses: combinedCourses,
      reason: 'Incluye cursos adicionales que podrían complementar tu aprendizaje',
      estimatedDuration: totalDuration,
      difficulty: 'intermediate',
      skills: extractSkillsFromCourses(combinedCourses),
    });
  }
  
  // Si se especificó un área de enfoque, filtrar o priorizar
  if (focusArea && suggestions.length > 0) {
    for (const suggestion of suggestions) {
      const focusLower = focusArea.toLowerCase();
      const relevantCourses = suggestion.courses.filter(c => 
        c.category?.toLowerCase().includes(focusLower) ||
        c.title.toLowerCase().includes(focusLower) ||
        c.description?.toLowerCase().includes(focusLower)
      );
      
      if (relevantCourses.length > 0) {
        suggestion.courses = [
          ...relevantCourses,
          ...suggestion.courses.filter(c => !relevantCourses.includes(c)),
        ];
      }
    }
  }
  
  return suggestions;
}

/**
 * Extrae skills de los cursos basándose en categorías y títulos
 */
function extractSkillsFromCourses(courses: CourseInfo[]): string[] {
  const skills = new Set<string>();
  
  for (const course of courses) {
    if (course.category) {
      skills.add(course.category);
    }
    
    // Extraer palabras clave del título
    const keywords = ['IA', 'AI', 'Machine Learning', 'Data', 'Python', 'JavaScript', 
                     'Marketing', 'Ventas', 'Liderazgo', 'Gestión', 'Automatización'];
    for (const keyword of keywords) {
      if (course.title.toLowerCase().includes(keyword.toLowerCase())) {
        skills.add(keyword);
      }
    }
  }
  
  return Array.from(skills).slice(0, 5);
}
