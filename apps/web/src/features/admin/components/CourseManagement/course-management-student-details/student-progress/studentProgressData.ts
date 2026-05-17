import {
  CheckCircle2,
  Clock,
  Rocket,
  Sprout,
  Star,
  Target,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import {
  DEFAULT_ACTIVE_DAYS,
  DEFAULT_CONVERSATIONS_BY_WEEK,
  DEFAULT_CONVERSATION_TOPICS,
  DEFAULT_DAILY_STUDY_TIME,
  DEFAULT_PREFERRED_TIME_SLOTS,
  DEFAULT_WEEKLY_PROGRESS,
} from '../../CourseManagementStudentDetails.service';
import { COURSE_MANAGEMENT_STAT_GRADIENT_CLASSES } from '../../courseManagementTheme';
import type { ChartRow, ConversationTopic, MetricCard, StudentData, TimeSlot } from './types';

export function buildStudentProgressData(studentDetailsData: Record<string, unknown>, selectedStudent: Record<string, unknown>) {
  const sd = studentDetailsData as StudentData;
  const progress = Number(sd.enrollment?.progressPercentage ?? selectedStudent.progress_percentage ?? 0);
  const weeklyProgress = sd.studySessions?.weeklyProgress?.length ? sd.studySessions.weeklyProgress : DEFAULT_WEEKLY_PROGRESS;
  const dailyStudyTime = sd.studySessions?.dailyStudyTime?.length ? sd.studySessions.dailyStudyTime : DEFAULT_DAILY_STUDY_TIME;
  const preferredTimeSlots = sd.studySessions?.preferredTimeSlots?.length ? sd.studySessions.preferredTimeSlots : DEFAULT_PREFERRED_TIME_SLOTS;
  const activeDays = sd.studySessions?.activeDays?.length ? sd.studySessions.activeDays : DEFAULT_ACTIVE_DAYS;
  const conversationsByWeek = sd.lia?.conversationsByWeek?.length
    ? sd.lia.conversationsByWeek.map((week, index) => ({ semana: week.week || `S${index + 1}`, conversaciones: week.count || 0 }))
    : DEFAULT_CONVERSATIONS_BY_WEEK.map((week) => ({ semana: week.week, conversaciones: week.count }));
  const conversationTopics = sd.lia?.conversationTopics?.length ? sd.lia.conversationTopics : DEFAULT_CONVERSATION_TOPICS;

  return {
    activeDays: activeDays as ChartRow[],
    conversationTopics: conversationTopics as ConversationTopic[],
    conversationsByWeek: conversationsByWeek as ChartRow[],
    dailyStudyTime: dailyStudyTime as ChartRow[],
    preferredTimeSlots: preferredTimeSlots as TimeSlot[],
    sd,
    metrics: buildMetrics(sd, Math.round(progress)),
    weeklyProgress: weeklyProgress as ChartRow[],
  };
}

function buildMetrics(sd: StudentData, progress: number) {
  const topMetrics: MetricCard[] = [
    { icon: Target, label: 'Progreso Total', value: `${progress}%`, gradient: COURSE_MANAGEMENT_STAT_GRADIENT_CLASSES.primary },
    { icon: Clock, label: 'Tiempo de Estudio', value: `${sd.studySessions?.totalCourseStudyTime || sd.studySessions?.totalStudyTime || 0} hrs`, gradient: COURSE_MANAGEMENT_STAT_GRADIENT_CLASSES.accent },
    { icon: CheckCircle2, label: 'Actividades Completadas', value: `${sd.engagement?.activitiesCompleted || 0}`, gradient: COURSE_MANAGEMENT_STAT_GRADIENT_CLASSES.success },
    { icon: TrendingUp, label: 'Racha de Dias', value: `${sd.studySessions?.studyStreak || 0} dias`, gradient: COURSE_MANAGEMENT_STAT_GRADIENT_CLASSES.warning },
  ];
  const sofliaMetrics: MetricCard[] = [
    { icon: Rocket, label: 'Conversaciones Totales', value: `${sd.lia?.totalConversations || 0}`, sublabel: `${sd.lia?.conversationsThisWeek || 0} esta semana`, gradient: COURSE_MANAGEMENT_STAT_GRADIENT_CLASSES.primary },
    { icon: Sprout, label: 'Mensajes Intercambiados', value: `${sd.lia?.totalMessages || 0}`, sublabel: `Promedio: ${sd.lia?.avgMessagesPerConversation || 0} por conversacion`, gradient: COURSE_MANAGEMENT_STAT_GRADIENT_CLASSES.accent },
    { icon: Star, label: 'Feedback Positivo', value: `${sd.lia?.positiveFeedbackRate || 0}%`, sublabel: `${sd.lia?.positiveFeedbackCount || 0} de ${sd.lia?.totalConversations || 0} conversaciones`, gradient: COURSE_MANAGEMENT_STAT_GRADIENT_CLASSES.success },
  ];
  const studyMetrics: MetricCard[] = [
    { icon: Clock, label: 'Sesiones Totales', value: `${sd.studySessions?.totalSessions || 0}`, sublabel: sd.studySessions?.lastSession?.hoursAgo ? `Ultima: Hace ${sd.studySessions.lastSession.hoursAgo} horas` : 'Sin sesiones', gradient: COURSE_MANAGEMENT_STAT_GRADIENT_CLASSES.success },
    { icon: TrendingUp, label: 'Duracion Promedio', value: `${sd.studySessions?.avgSessionDuration || 0} min`, sublabel: 'Por sesion', gradient: COURSE_MANAGEMENT_STAT_GRADIENT_CLASSES.accent },
    { icon: Target, label: 'Tiempo Total', value: `${sd.studySessions?.totalCourseStudyTime || sd.studySessions?.totalStudyTime || 0} hrs`, sublabel: 'En este curso', gradient: COURSE_MANAGEMENT_STAT_GRADIENT_CLASSES.warning },
    { icon: BarChart3, label: 'Frecuencia Semanal', value: `${sd.studySessions?.weeklyFrequency || 0} dias`, sublabel: 'Promedio por semana', gradient: COURSE_MANAGEMENT_STAT_GRADIENT_CLASSES.primary },
  ];
  return { sofliaMetrics, studyMetrics, topMetrics };
}
