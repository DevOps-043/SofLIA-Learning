import {
  CheckCircle2,
  Rocket,
  Sprout,
  Star,
  Target,
} from 'lucide-react';
import {
  DEFAULT_CONVERSATIONS_BY_WEEK,
  DEFAULT_CONVERSATION_TOPICS,
} from '../../CourseManagementStudentDetails.service';
import { COURSE_MANAGEMENT_STAT_GRADIENT_CLASSES } from '../../courseManagementTheme';
import type { ChartRow, ConversationTopic, MetricCard, StudentData } from './types';

export function buildStudentProgressData(studentDetailsData: Record<string, unknown>, selectedStudent: Record<string, unknown>) {
  const sd = studentDetailsData as StudentData;
  const progress = Number(sd.enrollment?.progressPercentage ?? selectedStudent.progress_percentage ?? 0);
  const conversationsByWeek = sd.lia?.conversationsByWeek?.length
    ? sd.lia.conversationsByWeek.map((week, index) => ({ semana: week.week || `S${index + 1}`, conversaciones: week.count || 0 }))
    : DEFAULT_CONVERSATIONS_BY_WEEK.map((week) => ({ semana: week.week, conversaciones: week.count }));
  const conversationTopics = sd.lia?.conversationTopics?.length ? sd.lia.conversationTopics : DEFAULT_CONVERSATION_TOPICS;

  return {
    conversationTopics: conversationTopics as ConversationTopic[],
    conversationsByWeek: conversationsByWeek as ChartRow[],
    sd,
    metrics: buildMetrics(sd, Math.round(progress)),
  };
}

function buildMetrics(sd: StudentData, progress: number) {
  const topMetrics: MetricCard[] = [
    { icon: Target, label: 'Progreso Total', value: `${progress}%`, gradient: COURSE_MANAGEMENT_STAT_GRADIENT_CLASSES.primary },
    { icon: CheckCircle2, label: 'Actividades Completadas', value: `${sd.engagement?.activitiesCompleted || 0}`, gradient: COURSE_MANAGEMENT_STAT_GRADIENT_CLASSES.success },
  ];
  const sofliaMetrics: MetricCard[] = [
    { icon: Rocket, label: 'Conversaciones Totales', value: `${sd.lia?.totalConversations || 0}`, sublabel: `${sd.lia?.conversationsThisWeek || 0} esta semana`, gradient: COURSE_MANAGEMENT_STAT_GRADIENT_CLASSES.primary },
    { icon: Sprout, label: 'Mensajes Intercambiados', value: `${sd.lia?.totalMessages || 0}`, sublabel: `Promedio: ${sd.lia?.avgMessagesPerConversation || 0} por conversacion`, gradient: COURSE_MANAGEMENT_STAT_GRADIENT_CLASSES.accent },
    { icon: Star, label: 'Feedback Positivo', value: `${sd.lia?.positiveFeedbackRate || 0}%`, sublabel: `${sd.lia?.positiveFeedbackCount || 0} de ${sd.lia?.totalConversations || 0} conversaciones`, gradient: COURSE_MANAGEMENT_STAT_GRADIENT_CLASSES.success },
  ];
  return { sofliaMetrics, topMetrics };
}
