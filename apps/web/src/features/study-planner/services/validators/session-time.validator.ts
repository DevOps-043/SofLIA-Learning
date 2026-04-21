import type { LessonDuration } from '../../types/user-context.types';
import type { ValidationResult } from '../validation.service';

export function validateMinimumSessionTime(
  sessionMinutes: number,
  lessonDurations: LessonDuration[],
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  if (lessonDurations.length === 0) {
    return { isValid: true, errors, warnings: ['No hay lecciones para validar'], suggestions };
  }

  const minLessonTime = Math.min(...lessonDurations.map((l) => l.totalMinutes));

  if (sessionMinutes < minLessonTime) {
    errors.push(
      `El tiempo mínimo de sesión (${sessionMinutes} min) es menor que la lección más corta (${Math.ceil(minLessonTime)} min).`,
    );
    suggestions.push(
      `Aumenta el tiempo mínimo de sesión a al menos ${Math.ceil(minLessonTime)} minutos para poder completar al menos una lección por sesión.`,
    );
  }

  if (sessionMinutes < minLessonTime * 1.2 && sessionMinutes >= minLessonTime) {
    warnings.push('El tiempo mínimo de sesión está muy ajustado. Considera aumentarlo para tener margen.');
  }

  return { isValid: errors.length === 0, errors, warnings, suggestions };
}

export function validateSessionTimes(minMinutes: number, maxMinutes: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  if (minMinutes <= 0) errors.push('El tiempo mínimo de sesión debe ser mayor a 0.');
  if (maxMinutes <= 0) errors.push('El tiempo máximo de sesión debe ser mayor a 0.');
  if (minMinutes >= maxMinutes) errors.push('El tiempo máximo debe ser mayor que el tiempo mínimo.');

  if (minMinutes < 15) {
    warnings.push('Sesiones de menos de 15 minutos pueden no ser efectivas para el aprendizaje.');
    suggestions.push('Considera aumentar el tiempo mínimo a al menos 15 minutos.');
  }

  if (maxMinutes > 120) {
    warnings.push('Sesiones de más de 2 horas pueden afectar la concentración.');
    suggestions.push('Considera dividir las sesiones largas con descansos frecuentes.');
  }

  if (maxMinutes > 180) {
    warnings.push('Las sesiones de más de 3 horas no son recomendables para la retención.');
  }

  return { isValid: errors.length === 0, errors, warnings, suggestions };
}

export function validateBreakTimes(sessionDuration: number, breakDuration: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  if (breakDuration < 0) {
    errors.push('El tiempo de descanso no puede ser negativo.');
  }

  if (breakDuration === 0) {
    warnings.push('No se han configurado descansos. Los descansos son importantes para la retención.');
    suggestions.push('Considera agregar al menos 5 minutos de descanso entre sesiones.');
  }

  if (sessionDuration <= 25) {
    if (breakDuration > 10) {
      warnings.push('Para sesiones cortas (25 min), los descansos de 5-10 minutos son óptimos.');
    }
  } else if (sessionDuration <= 45) {
    if (breakDuration < 5) {
      warnings.push('Para sesiones de 45 minutos, se recomiendan descansos de al menos 10 minutos.');
    }
  } else if (sessionDuration <= 90) {
    if (breakDuration < 10) {
      warnings.push('Para sesiones largas (60-90 min), se recomiendan descansos de 15-20 minutos.');
      suggestions.push('Considera incluir una actividad física ligera durante el descanso.');
    }
  } else {
    if (breakDuration < 15) {
      warnings.push('Para sesiones muy largas (>90 min), los descansos deben ser de al menos 15-20 minutos.');
      suggestions.push('Considera dividir la sesión en bloques más pequeños con descansos intermedios.');
    }
  }

  return { isValid: errors.length === 0, errors, warnings, suggestions };
}
