import type { TimeBlock } from '../../types/user-context.types';
import type { ValidationResult } from '../validation.service';

export function validateDaysAndHours(
  preferredDays: number[],
  timeBlocks: TimeBlock[],
  minSessionMinutes: number,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  if (!preferredDays || preferredDays.length === 0) {
    errors.push('Debes seleccionar al menos un día para estudiar.');
  }

  if (!timeBlocks || timeBlocks.length === 0) {
    errors.push('Debes configurar al menos un bloque de tiempo para estudiar.');
  }

  for (let i = 0; i < (timeBlocks || []).length; i++) {
    const block = timeBlocks[i];

    if (
      block.startHour < 0 || block.startHour > 23
      || block.endHour < 0 || block.endHour > 23
      || block.startMinute < 0 || block.startMinute > 59
      || block.endMinute < 0 || block.endMinute > 59
    ) {
      errors.push(`El bloque de tiempo ${i + 1} tiene valores inválidos.`);
      continue;
    }

    const startMinutes = block.startHour * 60 + block.startMinute;
    const endMinutes = block.endHour * 60 + block.endMinute;
    const blockDuration = endMinutes - startMinutes;

    if (blockDuration <= 0) {
      errors.push(
        `El bloque de tiempo ${i + 1} (${block.startHour}:${String(block.startMinute).padStart(2, '0')} - `
        + `${block.endHour}:${String(block.endMinute).padStart(2, '0')}) tiene duración inválida.`,
      );
    } else if (blockDuration < minSessionMinutes) {
      warnings.push(
        `El bloque de tiempo ${i + 1} (${blockDuration} min) es menor que el tiempo mínimo de sesión (${minSessionMinutes} min).`,
      );
    }

    for (let j = i + 1; j < (timeBlocks || []).length; j++) {
      const otherBlock = timeBlocks[j];
      const otherStart = otherBlock.startHour * 60 + otherBlock.startMinute;
      const otherEnd = otherBlock.endHour * 60 + otherBlock.endMinute;
      if (startMinutes < otherEnd && endMinutes > otherStart) {
        warnings.push(`Los bloques de tiempo ${i + 1} y ${j + 1} se solapan.`);
      }
    }
  }

  if ((preferredDays || []).length < 3) {
    warnings.push('Estudiar menos de 3 días por semana puede dificultar la retención.');
    suggestions.push('Considera distribuir tu estudio en más días con sesiones más cortas.');
  }

  return { isValid: errors.length === 0, errors, warnings, suggestions };
}
