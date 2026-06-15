import type { BusinessUserAnalyticsLocale } from '@/features/business-panel/types/business-user-analytics.types'

/** Claves de glosario: una explicación corta por métrica ("qué es / por qué importa"). */
export type UserStatsGlossaryKey =
  | 'averageProgress'
  | 'aiAdoption'
  | 'quality'
  | 'lessonsCompleted'
  | 'timeSpent'
  | 'certificates'
  | 'currentStreak'
  | 'completionRate'
  | 'questionQuality'
  | 'notes'
  | 'notesAdoption'
  | 'activities'
  | 'activitiesPassRate'
  | 'quizzesTaken'
  | 'quizzesPassed'
  | 'quizzesAverage'
  | 'quizzesTotalAttempts'

export interface UserStatsPdfCopy {
  title: string
  reportSubtitle: string
  generatedAt: string
  period: string
  organization: string
  sections: {
    overview: string
    progress: string
    courses: string
    ai: string
    quizzes: string
    quality: string
    engagement: string
    insights: string
    glossary: string
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
    lessonsWithQuiz: string
    quizzesTaken: string
    quizzesPassed: string
    quizzesAverage: string
    quizzesTotalAttempts: string
    quizzesRetries: string
  }
  glossary: Record<UserStatsGlossaryKey, string>
  columns: {
    course: string
    progress: string
    lessons: string
    time: string
    status: string
  }
  /** Etiqueta legible por estado de curso (`resolveCourseStatus`). */
  courseStatus: Record<string, string>
  /** Etiqueta legible por dimensión del radar de calidad (`quality.radar[].key`). */
  radar: Record<string, string>
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
    outOf: (value: number, total: number) => string
  }
}

const ES: UserStatsPdfCopy = {
  title: 'Estadísticas del usuario',
  reportSubtitle: 'Reporte de aprendizaje',
  generatedAt: 'Generado',
  period: 'Periodo',
  organization: 'Empresa',
  sections: {
    overview: 'Resumen general',
    progress: 'Indicadores de progreso',
    courses: 'Avance por curso',
    ai: 'Adopción de SofLIA',
    quizzes: 'Quizzes y exámenes',
    quality: 'Calidad del aprendizaje',
    engagement: 'Notas y actividades',
    insights: 'Feedback de SofLIA',
    glossary: 'Qué significa cada dato',
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
    activities: 'Actividades entregadas',
    activitiesPassRate: 'Tasa de aprobación',
    lessonsWithQuiz: 'Lecciones con quiz',
    quizzesTaken: 'Quizzes presentados',
    quizzesPassed: 'Quizzes aprobados',
    quizzesAverage: 'Calificación promedio',
    quizzesTotalAttempts: 'Intentos totales',
    quizzesRetries: 'Reintentos',
  },
  glossary: {
    averageProgress: 'Porcentaje promedio de avance en los cursos asignados.',
    aiAdoption: 'Cuánto usa SofLIA: conversaciones con interacción real frente a sus cursos.',
    quality: 'Índice combinado de progreso, actividades, uso de SofLIA, notas y quizzes.',
    lessonsCompleted: 'Lecciones marcadas como completadas en sus cursos.',
    timeSpent: 'Tiempo total estimado dedicado al estudio.',
    certificates: 'Certificados obtenidos al completar cursos.',
    currentStreak: 'Días seguidos con actividad de aprendizaje registrada.',
    completionRate: 'Porcentaje de los cursos asignados que ya terminó.',
    questionQuality: 'Qué tan claras y enfocadas son sus preguntas a SofLIA.',
    notes: 'Notas que el usuario creó durante el aprendizaje.',
    notesAdoption: 'En qué porcentaje de las lecciones tomó notas.',
    activities: 'Actividades entregadas, incluidas las conversaciones guiadas con SofLIA.',
    activitiesPassRate: 'Porcentaje de las actividades entregadas que fueron aprobadas.',
    quizzesTaken: 'Quizzes presentados, sobre el total de lecciones que tienen quiz (no toda lección tiene).',
    quizzesPassed: 'Quizzes aprobados (calificación suficiente).',
    quizzesAverage: 'Calificación promedio en los quizzes presentados.',
    quizzesTotalAttempts: 'Intentos totales registrados, incluyendo reintentos del mismo quiz.',
  },
  columns: {
    course: 'Curso',
    progress: 'Progreso',
    lessons: 'Lecciones',
    time: 'Tiempo (min)',
    status: 'Estado',
  },
  courseStatus: {
    completed: 'Completado',
    in_progress: 'En progreso',
    assigned: 'Asignado',
    not_started: 'No iniciado',
  },
  radar: {
    courses: 'Cursos',
    activities: 'Actividades',
    soflia: 'SofLIA',
    notes: 'Notas',
    quizzes: 'Quizzes',
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
    outOf: (value, total) => `${value} de ${total}`,
  },
}

const EN: UserStatsPdfCopy = {
  title: 'User statistics',
  reportSubtitle: 'Learning report',
  generatedAt: 'Generated',
  period: 'Period',
  organization: 'Company',
  sections: {
    overview: 'Overview',
    progress: 'Progress indicators',
    courses: 'Course progress',
    ai: 'SofLIA adoption',
    quizzes: 'Quizzes and exams',
    quality: 'Learning quality',
    engagement: 'Notes and activities',
    insights: 'SofLIA feedback',
    glossary: 'What each metric means',
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
    activities: 'Activities submitted',
    activitiesPassRate: 'Pass rate',
    lessonsWithQuiz: 'Lessons with quiz',
    quizzesTaken: 'Quizzes taken',
    quizzesPassed: 'Quizzes passed',
    quizzesAverage: 'Average score',
    quizzesTotalAttempts: 'Total attempts',
    quizzesRetries: 'Retries',
  },
  glossary: {
    averageProgress: 'Average completion across assigned courses.',
    aiAdoption: 'How much SofLIA is used: real conversations versus their courses.',
    quality: 'Combined index of progress, activities, SofLIA usage, notes and quizzes.',
    lessonsCompleted: 'Lessons marked as completed across their courses.',
    timeSpent: 'Total estimated time spent studying.',
    certificates: 'Certificates earned by completing courses.',
    currentStreak: 'Consecutive days with recorded learning activity.',
    completionRate: 'Percentage of assigned courses already finished.',
    questionQuality: 'How clear and on-topic their questions to SofLIA are.',
    notes: 'Notes the user created while learning.',
    notesAdoption: 'Share of lessons where they took notes.',
    activities: 'Activities submitted, including SofLIA guided conversations.',
    activitiesPassRate: 'Percentage of submitted activities that passed.',
    quizzesTaken: 'Quizzes taken out of all lessons that have a quiz (not every lesson does).',
    quizzesPassed: 'Quizzes passed (sufficient score).',
    quizzesAverage: 'Average score across the quizzes taken.',
    quizzesTotalAttempts: 'Total recorded attempts, including retries of the same quiz.',
  },
  columns: {
    course: 'Course',
    progress: 'Progress',
    lessons: 'Lessons',
    time: 'Time (min)',
    status: 'Status',
  },
  courseStatus: {
    completed: 'Completed',
    in_progress: 'In progress',
    assigned: 'Assigned',
    not_started: 'Not started',
  },
  radar: {
    courses: 'Courses',
    activities: 'Activities',
    soflia: 'SofLIA',
    notes: 'Notes',
    quizzes: 'Quizzes',
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
    outOf: (value, total) => `${value} of ${total}`,
  },
}

const PT: UserStatsPdfCopy = {
  title: 'Estatísticas do usuário',
  reportSubtitle: 'Relatório de aprendizagem',
  generatedAt: 'Gerado',
  period: 'Período',
  organization: 'Empresa',
  sections: {
    overview: 'Resumo geral',
    progress: 'Indicadores de progresso',
    courses: 'Progresso por curso',
    ai: 'Adoção da SofLIA',
    quizzes: 'Quizzes e provas',
    quality: 'Qualidade da aprendizagem',
    engagement: 'Notas e atividades',
    insights: 'Feedback da SofLIA',
    glossary: 'O que significa cada dado',
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
    activities: 'Atividades enviadas',
    activitiesPassRate: 'Taxa de aprovação',
    lessonsWithQuiz: 'Lições com quiz',
    quizzesTaken: 'Quizzes apresentados',
    quizzesPassed: 'Quizzes aprovados',
    quizzesAverage: 'Pontuação média',
    quizzesTotalAttempts: 'Tentativas totais',
    quizzesRetries: 'Repetições',
  },
  glossary: {
    averageProgress: 'Percentual médio de avanço nos cursos atribuídos.',
    aiAdoption: 'Quanto usa a SofLIA: conversas com interação real frente aos seus cursos.',
    quality: 'Índice combinado de progresso, atividades, uso da SofLIA, notas e quizzes.',
    lessonsCompleted: 'Lições marcadas como concluídas nos seus cursos.',
    timeSpent: 'Tempo total estimado dedicado ao estudo.',
    certificates: 'Certificados obtidos ao concluir cursos.',
    currentStreak: 'Dias seguidos com atividade de aprendizagem registrada.',
    completionRate: 'Percentual dos cursos atribuídos já concluídos.',
    questionQuality: 'Quão claras e focadas são suas perguntas à SofLIA.',
    notes: 'Notas que o usuário criou durante a aprendizagem.',
    notesAdoption: 'Em que percentual das lições fez anotações.',
    activities: 'Atividades enviadas, incluindo as conversas guiadas com a SofLIA.',
    activitiesPassRate: 'Percentual das atividades enviadas que foram aprovadas.',
    quizzesTaken: 'Quizzes apresentados, sobre o total de lições que têm quiz (nem toda lição tem).',
    quizzesPassed: 'Quizzes aprovados (pontuação suficiente).',
    quizzesAverage: 'Pontuação média nos quizzes apresentados.',
    quizzesTotalAttempts: 'Tentativas totais registradas, incluindo repetições do mesmo quiz.',
  },
  columns: {
    course: 'Curso',
    progress: 'Progresso',
    lessons: 'Lições',
    time: 'Tempo (min)',
    status: 'Status',
  },
  courseStatus: {
    completed: 'Concluído',
    in_progress: 'Em andamento',
    assigned: 'Atribuído',
    not_started: 'Não iniciado',
  },
  radar: {
    courses: 'Cursos',
    activities: 'Atividades',
    soflia: 'SofLIA',
    notes: 'Notas',
    quizzes: 'Quizzes',
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
    outOf: (value, total) => `${value} de ${total}`,
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
