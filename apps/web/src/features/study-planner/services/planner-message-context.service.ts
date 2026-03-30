import type {
  StudyPlannerCourseOption,
  StudyPlannerUserContext,
} from '../types/planner-ui.types';
import type {
  StudyPlannerCalendarDataMap,
  StudyPlannerStoredLessonDistribution,
} from '../types/planner-schedule.types';

const MONTH_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const;

const HOLIDAY_SUFFIXES = ['-01-01', '-12-25', '-05-01', '-09-16', '-11-20'] as const;

export interface PlannerMessageContextParams {
  availableCourses: StudyPlannerCourseOption[];
  selectedCourseIds: string[];
  savedLessonDistribution: StudyPlannerStoredLessonDistribution[];
  savedTargetDate: string | null;
  savedTotalLessons: number;
  userType: StudyPlannerUserContext['userType'];
  savedCalendarData: StudyPlannerCalendarDataMap | null;
}

interface GroupedDistributionDay {
  dateStr: string;
  dayName: string;
  items: StudyPlannerStoredLessonDistribution[];
}

export function formatPlannerDisplayDate(dateStr: string, dayName: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = Number.parseInt(parts[2], 10);
      const month = Number.parseInt(parts[1], 10) - 1;
      const year = Number.parseInt(parts[0], 10);

      if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year) && MONTH_NAMES[month]) {
        const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
        return `${capitalizedDay} ${day} de ${MONTH_NAMES[month]} de ${year}`;
      }
    }
  } catch (error) {
    console.error('Error formatting planner date:', error);
  }

  return `${dayName} ${dateStr}`;
}

function countAssignedLessons(distribution: StudyPlannerStoredLessonDistribution[]): number {
  return distribution.reduce((total, item) => {
    const lessonCount = item.lessons?.filter((lesson) => lesson?.lessonTitle?.trim()).length ?? 0;
    return total + lessonCount;
  }, 0);
}

function groupDistributionByDay(
  distribution: StudyPlannerStoredLessonDistribution[],
  options?: { excludeHolidayDates?: boolean },
): GroupedDistributionDay[] {
  const grouped = new Map<string, StudyPlannerStoredLessonDistribution[]>();

  distribution.forEach((item) => {
    if (!item?.dateStr || !item.startTime || !item.endTime) {
      return;
    }

    if (options?.excludeHolidayDates && HOLIDAY_SUFFIXES.some((suffix) => item.dateStr.includes(suffix))) {
      return;
    }

    const current = grouped.get(item.dateStr) ?? [];
    current.push(item);
    grouped.set(item.dateStr, current);
  });

  return Array.from(grouped.entries())
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([dateStr, items]) => ({
      dateStr,
      dayName: items[0]?.dayName ?? '',
      items,
    }));
}

function appendExistingSchedules(
  lines: string[],
  groupedDays: GroupedDistributionDay[],
  options?: { includeStudyLabel?: boolean; includeEmptyState?: boolean },
): void {
  groupedDays.forEach(({ dateStr, dayName, items }) => {
    lines.push(`**${formatPlannerDisplayDate(dateStr, dayName)}:**`);

    items.forEach((item) => {
      const heading = options?.includeStudyLabel
        ? `De ${item.startTime} a ${item.endTime}. Lecciones a estudiar:`
        : `De ${item.startTime} a ${item.endTime}:`;

      lines.push(heading);

      const lessonTitles = item.lessons
        ?.map((lesson) => lesson?.lessonTitle?.trim())
        .filter((lessonTitle): lessonTitle is string => Boolean(lessonTitle)) ?? [];

      if (lessonTitles.length === 0 && options?.includeEmptyState) {
        lines.push('- Sin lecciones asignadas');
        return;
      }

      lessonTitles.forEach((lessonTitle) => {
        const prefix = options?.includeStudyLabel ? '- ' : '  - ';
        lines.push(`${prefix}${lessonTitle}`);
      });
    });

    lines.push('');
  });
}

function appendSelectedCourses(lines: string[], courses: StudyPlannerCourseOption[], selectedCourseIds: string[]): void {
  lines.push('**Curso(s) seleccionado(s):**');

  selectedCourseIds.forEach((courseId) => {
    const course = courses.find((item) => item.id === courseId);
    if (course) {
      lines.push(`- ${course.title}`);
    }
  });

  lines.push('');
}

export function buildFinalPlanSummaryContext(params: PlannerMessageContextParams): string {
  const {
    availableCourses,
    selectedCourseIds,
    savedLessonDistribution,
    savedTargetDate,
    savedTotalLessons,
    userType,
  } = params;

  const lines: string[] = ['', '', '**RESUMEN DEL PLAN DE ESTUDIOS:**', ''];
  appendSelectedCourses(lines, availableCourses, selectedCourseIds);

  lines.push(`**Fecha limite para completar:** ${savedTargetDate || 'No especificada'}`);
  lines.push('');

  if (savedTargetDate) {
    lines.push('**REGLA ABSOLUTA SOBRE LA FECHA LIMITE:**');
    lines.push(`- La fecha limite establecida es: **${savedTargetDate}**`);
    lines.push('- NUNCA, bajo ninguna circunstancia, debes crear o sugerir horarios despues de esta fecha');
    lines.push(`- Si el usuario solicita agregar horarios, calcula solo hasta ${savedTargetDate}`);
    lines.push(`- Si un horario calculado cae despues de ${savedTargetDate}, NO lo incluyas`);
    lines.push('- NUNCA inventes fechas invalidas (ej: 30 de febrero, 31 de abril)');
    lines.push(`- Verifica que cada fecha generada sea valida y anterior o igual a ${savedTargetDate}`);
    lines.push('');
  }

  const totalLessonsAssigned = countAssignedLessons(savedLessonDistribution);
  const groupedDays = groupDistributionByDay(savedLessonDistribution, { excludeHolidayDates: true });

  lines.push('**DISTRIBUCION DE LECCIONES:**');
  lines.push(`Total de sesiones: ${savedLessonDistribution.length}`);
  lines.push(`Total de lecciones asignadas: ${totalLessonsAssigned}`);
  lines.push('');

  appendExistingSchedules(lines, groupedDays, {
    includeStudyLabel: true,
    includeEmptyState: true,
  });

  lines.push('**VERIFICACION DE COBERTURA:**');

  if (totalLessonsAssigned >= savedTotalLessons) {
    if (savedTargetDate) {
      lines.push(`Se completaran todas las ${savedTotalLessons} lecciones antes de ${savedTargetDate}.`);
    } else {
      lines.push(`Se completaran todas las ${savedTotalLessons} lecciones del plan.`);
    }
  } else if (userType === 'b2b') {
    lines.push(
      `**ALERTA CRITICA:** Se han asignado ${totalLessonsAssigned} de ${savedTotalLessons} lecciones. ` +
      `Faltan ${Math.max(savedTotalLessons - totalLessonsAssigned, 0)} por asignar.`,
    );
    lines.push('Para cumplir con los plazos organizacionales, es necesario asignar TODAS las lecciones.');
  } else {
    lines.push(
      `Se han asignado ${totalLessonsAssigned} de ${savedTotalLessons} lecciones. ` +
      `Faltan ${Math.max(savedTotalLessons - totalLessonsAssigned, 0)} por asignar.`,
    );
  }

  lines.push('');
  lines.push('**INSTRUCCIONES CRITICAS PARA EL RESUMEN:**');
  lines.push(`- Total de lecciones en el plan: ${totalLessonsAssigned} lecciones pendientes`);
  lines.push('- Las lecciones ya completadas fueron filtradas y no estan en este plan');
  lines.push('- USA SOLO LAS LECCIONES QUE ESTAN LISTADAS ARRIBA EN CADA HORARIO');
  lines.push('- NO inventes lecciones desde el principio');
  lines.push('- NO empieces desde "Leccion 1"; usa solo las lecciones que estan asignadas arriba');
  lines.push('- En tu contexto, usa solo las lecciones marcadas como "Pendiente"');
  lines.push('- NO incluyas lecciones marcadas como "Completada"');
  lines.push('- Cada horario ya tiene lecciones especificas asignadas; usa exactamente esas lecciones');
  lines.push('');
  lines.push(
    '*Genera un resumen completo con TODOS los horarios, usando exactamente las lecciones asignadas arriba en cada horario. ' +
    'NO inventes lecciones.*',
  );

  return lines.join('\n');
}

export function buildAddScheduleContext(params: PlannerMessageContextParams): string {
  const {
    savedLessonDistribution,
    savedTargetDate,
    savedTotalLessons,
    savedCalendarData,
  } = params;

  const totalLessonsAssigned = countAssignedLessons(savedLessonDistribution);
  const groupedDays = groupDistributionByDay(savedLessonDistribution);
  const lines: string[] = [
    '',
    '',
    '**INSTRUCCION CRITICA - AGREGAR HORARIOS:**',
    'El usuario esta solicitando AGREGAR nuevos horarios, NO reemplazar los existentes.',
    'DEBES MANTENER todos los horarios ya asignados y AGREGAR los nuevos horarios solicitados.',
    '',
    '**HORARIOS EXISTENTES QUE DEBES MANTENER:**',
    `Total de sesiones actuales: ${savedLessonDistribution.length}`,
    '',
  ];

  appendExistingSchedules(lines, groupedDays);

  lines.push('**RESUMEN DE HORARIOS EXISTENTES:**');
  lines.push(`- Total de sesiones: ${savedLessonDistribution.length}`);
  lines.push(`- Total de lecciones asignadas: ${totalLessonsAssigned}`);
  lines.push(`- Lecciones pendientes por asignar: ${Math.max(savedTotalLessons - totalLessonsAssigned, 0)}`);
  lines.push('');

  if (savedCalendarData && Object.keys(savedCalendarData).length > 0) {
    lines.push('**VALIDACION DE CONFLICTOS:**');
    lines.push('- Si los nuevos horarios solicitados tienen conflictos con eventos del calendario, NO los incluyas');
    lines.push('- Solo incluye los horarios nuevos que no tengan conflictos');
    lines.push('- Advierte al usuario sobre cualquier conflicto detectado');
    lines.push('');
  }

  if (savedTargetDate) {
    lines.push('**FECHA LIMITE:**');
    lines.push(`- Fecha limite establecida: **${savedTargetDate}**`);
    lines.push('- NO generes horarios despues de esta fecha');
    lines.push(`- Calcula los nuevos horarios SOLO hasta ${savedTargetDate}`);
    lines.push('');
  }

  lines.push('**INSTRUCCIONES CRITICAS PARA TU RESPUESTA:**');
  lines.push('1. MANTEN todos los horarios existentes listados arriba CON SUS LECCIONES EXACTAS');
  lines.push('2. AGREGA los nuevos horarios solicitados por el usuario');
  lines.push('3. Muestra un resumen COMPLETO con TODOS los horarios (existentes + nuevos)');
  lines.push('4. ORDENA TODOS LOS HORARIOS cronologicamente');
  lines.push('5. USA EXACTAMENTE LAS LECCIONES ASIGNADAS EN CADA HORARIO EXISTENTE');
  lines.push('6. NO inventes lecciones desde el principio');
  lines.push('7. NO empieces desde "Leccion 1"; usa solo las lecciones listadas arriba');
  lines.push('8. Si hay conflictos con el calendario, advierte al usuario pero incluye los horarios sin conflictos');
  lines.push('9. Distribuye las lecciones pendientes en los nuevos horarios agregados');
  lines.push('');

  return lines.join('\n');
}

export function buildChangeTargetDateContext(params: PlannerMessageContextParams): string {
  const {
    savedLessonDistribution,
    savedTotalLessons,
  } = params;

  const totalLessonsAssigned = countAssignedLessons(savedLessonDistribution);
  const groupedDays = groupDistributionByDay(savedLessonDistribution);
  const lines: string[] = [
    '',
    '',
    '**INSTRUCCION CRITICA - CAMBIAR FECHA LIMITE:**',
    'El usuario esta solicitando CAMBIAR la fecha limite, NO eliminar los horarios existentes.',
    'DEBES MANTENER todos los horarios ya asignados y actualizar la fecha limite.',
    'Si la nueva fecha limite es posterior a la anterior, puedes agregar mas horarios hasta la nueva fecha.',
    '',
    '**HORARIOS EXISTENTES QUE DEBES MANTENER:**',
    `Total de sesiones actuales: ${savedLessonDistribution.length}`,
    '',
  ];

  appendExistingSchedules(lines, groupedDays);

  lines.push('**RESUMEN DE HORARIOS EXISTENTES:**');
  lines.push(`- Total de sesiones: ${savedLessonDistribution.length}`);
  lines.push(`- Total de lecciones asignadas: ${totalLessonsAssigned}`);
  lines.push(`- Lecciones pendientes por asignar: ${Math.max(savedTotalLessons - totalLessonsAssigned, 0)}`);
  lines.push('');
  lines.push('**INSTRUCCIONES PARA CAMBIAR FECHA LIMITE:**');
  lines.push('1. MANTEN todos los horarios existentes listados arriba');
  lines.push('2. Extrae la nueva fecha limite del mensaje del usuario');
  lines.push('3. Si la nueva fecha es posterior a la anterior, puedes agregar mas horarios hasta la nueva fecha');
  lines.push('4. Si la nueva fecha es anterior, mantén solo los horarios que esten antes de la nueva fecha');
  lines.push('5. Muestra un resumen COMPLETO con TODOS los horarios (existentes + nuevos si aplica)');
  lines.push('6. ORDENA TODOS LOS HORARIOS cronologicamente');
  lines.push('7. USA EXACTAMENTE LAS LECCIONES ASIGNADAS EN CADA HORARIO EXISTENTE');
  lines.push('8. NO inventes lecciones desde el principio');
  lines.push('9. NO empieces desde "Leccion 1"; usa solo las lecciones listadas arriba');
  lines.push('10. Distribuye las lecciones pendientes en los nuevos horarios si se agregaron');
  lines.push('');

  return lines.join('\n');
}
