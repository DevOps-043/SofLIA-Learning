import { HolidayService } from '../../../lib/holidays';

import { generateStudyPlannerPrompt } from '../prompts/study-planner.prompt';
import { sendStudyPlannerChatRequest } from './planner-chat-request.service';
import type {
  StudyPlannerAssignedCourse,
  StudyPlannerUserContext,
} from '../types/planner-ui.types';
import type { StudyPlannerCalendarDataMap } from '../types/planner-schedule.types';
import type { OrganizationHoliday, OrganizationPlannerConfig } from './organization-planner-config.service';

const STUDY_PLANNER_WELCOME_AUDIO_MESSAGE =
  'Bienvenido al Planificador de Estudios. Soy SofLIA, tu asistente de aprendizaje.';

export const STUDY_PLANNER_WELCOME_REQUEST_TIMEOUT_MS = 8000;

interface RequestStudyPlannerWelcomeMessageParams {
  assignedCourses: StudyPlannerAssignedCourse[];
  lessonsContext: string;
  organizationHolidays?: OrganizationHoliday[];
  organizationPlannerConfig?: OrganizationPlannerConfig | null;
  savedCalendarData: StudyPlannerCalendarDataMap | null;
  signal?: AbortSignal;
  userContext: StudyPlannerUserContext;
}

interface FormattedWelcomeCourse {
  dueDate: string | null;
  title: string;
}

function formatWelcomeDueDate(value: string): string {
  return new Date(value).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatAssignedCourses(
  assignedCourses: StudyPlannerAssignedCourse[],
): FormattedWelcomeCourse[] {
  return assignedCourses.map((course) => ({
    dueDate: course.dueDate ? formatWelcomeDueDate(course.dueDate) : null,
    title: course.title,
  }));
}

function buildWelcomeKickoffMessage(
  userContext: StudyPlannerUserContext,
  courses: FormattedWelcomeCourse[],
): string {
  const teamNames =
    userContext.workTeams && userContext.workTeams.length > 0
      ? userContext.workTeams.map((team) => team.name).join(', ')
      : 'Ninguno';

  const formattedCourses =
    courses.length > 0
      ? courses
          .map((course) =>
            `"${course.title}"${course.dueDate ? ` (fecha limite: ${course.dueDate})` : ''}`,
          )
          .join(', ')
      : 'Ninguno';

  return [
    '[INICIO_PLANIFICADOR]',
    'El usuario acaba de abrir el planificador de estudios.',
    'Genera un mensaje de bienvenida personalizado con la informacion disponible.',
    '',
    'DATOS DEL USUARIO:',
    `- Rol: ${userContext.rol || 'No especificado'}`,
    `- Area: ${userContext.area || 'No especificada'}`,
    `- Organizacion: ${userContext.organizationName || 'No especificada'}`,
    `- Equipos: ${teamNames}`,
    `- Cursos asignados: ${formattedCourses}`,
    '',
    'INSTRUCCIONES:',
    '1. Presentate como SofLIA, el asistente del Planificador de Estudios.',
    '2. Menciona brevemente que analizaste la informacion del usuario.',
    '3. Destaca su rol y organizacion si estan disponibles.',
    '4. Si tiene equipos, mencionalos brevemente.',
    '5. Lista los cursos asignados como INFORMACION (NO los planifiques todos automaticamente).',
    '6. Pregunta al usuario CUAL curso quiere planificar en este momento.',
    '7. Aclara que se planifica UN curso a la vez.',
    '8. Si solo hay un curso asignado, sugiérelo pero deja que el usuario confirme.',
    '9. Usa un tono profesional, cercano y claro.',
    '10. Usa markdown para negritas y listas cuando agregue valor.',
  ].join('\n');
}

function buildWelcomeDueDateContext(courses: FormattedWelcomeCourse[]): string {
  const firstCourseWithDueDate = courses.find((course) => course.dueDate);
  if (!firstCourseWithDueDate?.dueDate) {
    return '';
  }

  return [
    '',
    '',
    `FECHA LIMITE OBLIGATORIA: ${firstCourseWithDueDate.dueDate}`,
    'Todas las lecciones deben completarse antes de esa fecha.',
  ].join('\n');
}

function buildWelcomeCalendarContext(
  savedCalendarData: StudyPlannerCalendarDataMap | null,
  organizationHolidays?: OrganizationHoliday[],
): string {
  const busyList: string[] = [];
  const today = new Date();
  const futureDate = new Date();
  futureDate.setMonth(today.getMonth() + 6);

  // Official country holidays (MX)
  const holidays = HolidayService.getHolidaysInRange(today, futureDate, 'MX');
  for (const holiday of holidays) {
    busyList.push(`- ${holiday.date}: DIA FESTIVO OFICIAL (${holiday.name.toUpperCase()}) - PROHIBIDO PROGRAMAR LECCIONES`);
  }

  // Organization-specific holidays (internal + official from org config)
  if (organizationHolidays && organizationHolidays.length > 0) {
    for (const orgHoliday of organizationHolidays) {
      const label = orgHoliday.type === 'internal' ? 'DIA INTERNO EMPRESA' : 'DIA FESTIVO ORG';
      busyList.push(`- ${orgHoliday.date}: ${label} (${orgHoliday.name.toUpperCase()}) - NO PROGRAMAR LECCIONES`);
    }
  }

  if (savedCalendarData) {
    for (const [dateKey, dayData] of Object.entries(savedCalendarData)) {
      for (const slot of dayData?.busySlots ?? []) {
        const start = new Date(slot.start);
        const end = new Date(slot.end);
        const timeStr =
          `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}` +
          ` - ${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;
        busyList.push(`- ${dateKey}: ${timeStr} (Usuario ocupado)`);
      }
    }
  }

  if (busyList.length === 0) {
    return '';
  }

  return `\n\nRESTRICCIONES DE TIEMPO (CALENDARIO Y FESTIVOS):\n${busyList.join('\n')}`;
}

function buildOrgConfigContext(
  orgConfig?: OrganizationPlannerConfig | null,
): string {
  if (!orgConfig) {
    return '';
  }

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
  const workDayNames = orgConfig.workDays.map((d) => dayNames[d] || `Dia${d}`).join(', ');

  return [
    '',
    '',
    'CONFIGURACION ORGANIZACIONAL B2B:',
    `- Horario laboral: ${orgConfig.workStartTime} - ${orgConfig.workEndTime}`,
    `- Dias habiles: ${workDayNames}`,
    `- Max lecciones por dia: ${orgConfig.maxLessonsPerDay}`,
    `- Max minutos por sesion: ${orgConfig.maxSessionMinutes}`,
    `- Zona horaria: ${orgConfig.timezone}`,
    '- NOTA: El planificador SUGIERE dentro de horario laboral pero NO bloquea al usuario.',
  ].join('\n');
}

function buildWelcomeSystemPrompt(
  userContext: StudyPlannerUserContext,
  courses: FormattedWelcomeCourse[],
  lessonsContext: string,
  savedCalendarData: StudyPlannerCalendarDataMap | null,
  organizationHolidays?: OrganizationHoliday[],
  organizationPlannerConfig?: OrganizationPlannerConfig | null,
): string {
  const currentDate = new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
    year: 'numeric',
  });

  const coursesContext = courses
    .map((course) => `- ${course.title}${course.dueDate ? ` (Fecha limite: ${course.dueDate})` : ''}`)
    .join('\n');

  return generateStudyPlannerPrompt({
    currentDate,
    studyPlannerContextString:
      `CURSOS ASIGNADOS:\n${coursesContext || 'No hay cursos asignados'}\n\n` +
      `LECCIONES PENDIENTES:\n${lessonsContext}` +
      buildWelcomeDueDateContext(courses) +
      buildWelcomeCalendarContext(savedCalendarData, organizationHolidays) +
      buildOrgConfigContext(organizationPlannerConfig),
    userName: userContext.userName || undefined,
  });
}

export function getStudyPlannerWelcomeAudioMessage(): string {
  return STUDY_PLANNER_WELCOME_AUDIO_MESSAGE;
}

export function getStudyPlannerWelcomeFallbackMessage(hasAssignedCourses: boolean): string {
  if (hasAssignedCourses) {
    return 'Hola! Soy SofLIA, tu asistente del Planificador de Estudios. Estoy aqui para ayudarte a organizar tu tiempo de estudio. Que tipo de sesiones prefieres: rapidas, normales o largas?';
  }

  return 'Hola! Soy SofLIA, tu asistente del Planificador de Estudios. Como te gustaria organizar tus sesiones de estudio?';
}

export async function requestStudyPlannerWelcomeMessage(
  params: RequestStudyPlannerWelcomeMessageParams,
): Promise<{ conversationId?: string; response: string }> {
  const formattedCourses = formatAssignedCourses(params.assignedCourses);

  return sendStudyPlannerChatRequest({
    conversationHistory: [],
    message: buildWelcomeKickoffMessage(params.userContext, formattedCourses),
    signal: params.signal,
    systemPrompt: buildWelcomeSystemPrompt(
      params.userContext,
      formattedCourses,
      params.lessonsContext,
      params.savedCalendarData,
      params.organizationHolidays,
      params.organizationPlannerConfig,
    ),
    userName: params.userContext.userName || undefined,
  });
}
