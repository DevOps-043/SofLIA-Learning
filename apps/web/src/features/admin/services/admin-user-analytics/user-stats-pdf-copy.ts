import type { BusinessUserAnalyticsLocale } from '@/features/business-panel/types/business-user-analytics.types'

export interface UserStatsPdfCopy {
  title: string
  generatedAt: string
  period: string
  organization: string
  sections: {
    overview: string
    progress: string
    courses: string
    ai: string
    quality: string
    engagement: string
    insights: string
  }
  metrics: {
    averageProgress: string
    aiAdoption: string
    quality: string
    lessonsCompleted: string
    timeSpent: string
    certificates: string
    currentStreak: string
    completionRate: string
    questionRate: string
    questionQuality: string
    offTopic: string
    responseTime: string
    notes: string
    notesAdoption: string
    activities: string
    activitiesPassRate: string
    quizzes: string
    quizzesAverage: string
  }
  columns: {
    course: string
    progress: string
    lessons: string
    time: string
    status: string
  }
  insights: {
    summary: string
    strengths: string
    opportunities: string
    recommendations: string
  }
  values: {
    coursesAssigned: (completed: number, total: number) => string
    conversations: (conversations: number, messages: number) => string
    signals: (count: number) => string
    minutes: (value: number) => string
    seconds: (value: number) => string
    days: (value: number) => string
  }
}

const ES: UserStatsPdfCopy = {
  title: 'Estadísticas del usuario',
  generatedAt: 'Generado',
  period: 'Periodo',
  organization: 'Empresa',
  sections: {
    overview: 'Resumen general',
    progress: 'Indicadores de progreso',
    courses: 'Avance por curso',
    ai: 'Adopción de SofLIA',
    quality: 'Calidad del aprendizaje',
    engagement: 'Notas, actividades y evaluaciones',
    insights: 'Feedback de SofLIA',
  },
  metrics: {
    averageProgress: 'Progreso promedio',
    aiAdoption: 'Adopción de SofLIA',
    quality: 'Calidad global',
    lessonsCompleted: 'Lecciones completadas',
    timeSpent: 'Tiempo de estudio',
    certificates: 'Certificados',
    currentStreak: 'Racha actual',
    completionRate: 'Tasa de finalización',
    questionRate: 'Preguntas',
    questionQuality: 'Calidad de preguntas',
    offTopic: 'Fuera de tema',
    responseTime: 'Tiempo de respuesta',
    notes: 'Notas totales',
    notesAdoption: 'Adopción de notas',
    activities: 'Entregas de actividades',
    activitiesPassRate: 'Tasa de aprobación',
    quizzes: 'Intentos de evaluación',
    quizzesAverage: 'Puntaje promedio',
  },
  columns: {
    course: 'Curso',
    progress: 'Progreso',
    lessons: 'Lecciones',
    time: 'Tiempo (min)',
    status: 'Estado',
  },
  insights: {
    summary: 'Resumen',
    strengths: 'Fortalezas',
    opportunities: 'Oportunidades',
    recommendations: 'Recomendaciones',
  },
  values: {
    coursesAssigned: (completed, total) => `${completed}/${total} cursos completados`,
    conversations: (conversations, messages) => `${conversations} conversaciones · ${messages} mensajes`,
    signals: (count) => `${count} señales analizadas`,
    minutes: (value) => `${value} min`,
    seconds: (value) => `${value} s`,
    days: (value) => `${value} días`,
  },
}

const EN: UserStatsPdfCopy = {
  title: 'User statistics',
  generatedAt: 'Generated',
  period: 'Period',
  organization: 'Company',
  sections: {
    overview: 'Overview',
    progress: 'Progress indicators',
    courses: 'Course progress',
    ai: 'SofLIA adoption',
    quality: 'Learning quality',
    engagement: 'Notes, activities and quizzes',
    insights: 'SofLIA feedback',
  },
  metrics: {
    averageProgress: 'Average progress',
    aiAdoption: 'SofLIA adoption',
    quality: 'Overall quality',
    lessonsCompleted: 'Lessons completed',
    timeSpent: 'Study time',
    certificates: 'Certificates',
    currentStreak: 'Current streak',
    completionRate: 'Completion rate',
    questionRate: 'Questions',
    questionQuality: 'Question quality',
    offTopic: 'Off-topic',
    responseTime: 'Response time',
    notes: 'Total notes',
    notesAdoption: 'Notes adoption',
    activities: 'Activity submissions',
    activitiesPassRate: 'Pass rate',
    quizzes: 'Quiz attempts',
    quizzesAverage: 'Average score',
  },
  columns: {
    course: 'Course',
    progress: 'Progress',
    lessons: 'Lessons',
    time: 'Time (min)',
    status: 'Status',
  },
  insights: {
    summary: 'Summary',
    strengths: 'Strengths',
    opportunities: 'Opportunities',
    recommendations: 'Recommendations',
  },
  values: {
    coursesAssigned: (completed, total) => `${completed}/${total} courses completed`,
    conversations: (conversations, messages) => `${conversations} conversations · ${messages} messages`,
    signals: (count) => `${count} signals analyzed`,
    minutes: (value) => `${value} min`,
    seconds: (value) => `${value} s`,
    days: (value) => `${value} days`,
  },
}

const PT: UserStatsPdfCopy = {
  title: 'Estatísticas do usuário',
  generatedAt: 'Gerado',
  period: 'Período',
  organization: 'Empresa',
  sections: {
    overview: 'Resumo geral',
    progress: 'Indicadores de progresso',
    courses: 'Progresso por curso',
    ai: 'Adoção da SofLIA',
    quality: 'Qualidade da aprendizagem',
    engagement: 'Notas, atividades e avaliações',
    insights: 'Feedback da SofLIA',
  },
  metrics: {
    averageProgress: 'Progresso médio',
    aiAdoption: 'Adoção da SofLIA',
    quality: 'Qualidade global',
    lessonsCompleted: 'Lições concluídas',
    timeSpent: 'Tempo de estudo',
    certificates: 'Certificados',
    currentStreak: 'Sequência atual',
    completionRate: 'Taxa de conclusão',
    questionRate: 'Perguntas',
    questionQuality: 'Qualidade das perguntas',
    offTopic: 'Fora do tema',
    responseTime: 'Tempo de resposta',
    notes: 'Notas totais',
    notesAdoption: 'Adoção de notas',
    activities: 'Envios de atividades',
    activitiesPassRate: 'Taxa de aprovação',
    quizzes: 'Tentativas de avaliação',
    quizzesAverage: 'Pontuação média',
  },
  columns: {
    course: 'Curso',
    progress: 'Progresso',
    lessons: 'Lições',
    time: 'Tempo (min)',
    status: 'Status',
  },
  insights: {
    summary: 'Resumo',
    strengths: 'Pontos fortes',
    opportunities: 'Oportunidades',
    recommendations: 'Recomendações',
  },
  values: {
    coursesAssigned: (completed, total) => `${completed}/${total} cursos concluídos`,
    conversations: (conversations, messages) => `${conversations} conversas · ${messages} mensagens`,
    signals: (count) => `${count} sinais analisados`,
    minutes: (value) => `${value} min`,
    seconds: (value) => `${value} s`,
    days: (value) => `${value} dias`,
  },
}

const COPY_BY_LOCALE: Record<BusinessUserAnalyticsLocale, UserStatsPdfCopy> = {
  es: ES,
  en: EN,
  pt: PT,
}

export function getUserStatsPdfCopy(locale: BusinessUserAnalyticsLocale): UserStatsPdfCopy {
  return COPY_BY_LOCALE[locale] ?? ES
}
