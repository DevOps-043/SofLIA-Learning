import type { ReportsAnalyticsLocale } from '../../../types/reports-analytics.types'

const ES = {
  title: 'Reporte SofLIA de analytics', generatedAt: 'Generado', period: 'Periodo',
  executiveMetrics: 'Metricas ejecutivas', operationalSnapshot: 'Lectura operativa',
  users: 'Usuarios', activeUsers: 'Usuarios activos', learning: 'Aprendizaje',
  activities: 'Actividades', progress: 'Progreso', completion: 'Finalizacion',
  completed: 'Completados', averageCompletionDays: 'Dias promedio de cierre',
  soflia: 'SofLIA', conversations: 'conversaciones', notes: 'Notas',
  notesCreated: 'notas creadas', planner: 'Planificacion', quality: 'Evidencia evaluada',
  findings: 'Hallazgos', segments: 'Segmentos a observar', age: 'Edad',
  gender: 'Genero', jobTitle: 'Puesto', role: 'Rol', hierarchy: 'Ranking por jerarquia',
  courseRisks: 'Cursos con riesgo', segment: 'Segmento', rank: '#', name: 'Nombre',
  course: 'Curso', overdue: 'Vencidos', risks: 'Riesgos',
  recommendations: 'Recomendaciones', actionPlan: 'Plan de accion',
}

const EN = {
  title: 'SofLIA analytics report', generatedAt: 'Generated', period: 'Period',
  executiveMetrics: 'Executive metrics', operationalSnapshot: 'Operational read',
  users: 'Users', activeUsers: 'Active users', learning: 'Learning',
  activities: 'Activities', progress: 'Progress', completion: 'Completion',
  completed: 'Completed', averageCompletionDays: 'Average closing days',
  soflia: 'SofLIA', conversations: 'conversations', notes: 'Notes',
  notesCreated: 'notes created', planner: 'Planning', quality: 'Evaluated evidence',
  findings: 'Findings', segments: 'Segments to watch', age: 'Age',
  gender: 'Gender', jobTitle: 'Job title', role: 'Role', hierarchy: 'Hierarchy ranking',
  courseRisks: 'Course risks', segment: 'Segment', rank: '#', name: 'Name',
  course: 'Course', overdue: 'Overdue', risks: 'Risks',
  recommendations: 'Recommendations', actionPlan: 'Action plan',
}

const PT = {
  title: 'Relatorio SofLIA de analytics', generatedAt: 'Gerado', period: 'Periodo',
  executiveMetrics: 'Metricas executivas', operationalSnapshot: 'Leitura operacional',
  users: 'Usuarios', activeUsers: 'Usuarios ativos', learning: 'Aprendizagem',
  activities: 'Atividades', progress: 'Progresso', completion: 'Conclusao',
  completed: 'Concluidos', averageCompletionDays: 'Dias medios de fechamento',
  soflia: 'SofLIA', conversations: 'conversas', notes: 'Notas',
  notesCreated: 'notas criadas', planner: 'Planejamento', quality: 'Evidencia avaliada',
  findings: 'Achados', segments: 'Segmentos a observar', age: 'Idade',
  gender: 'Genero', jobTitle: 'Cargo', role: 'Funcao', hierarchy: 'Ranking por hierarquia',
  courseRisks: 'Cursos com risco', segment: 'Segmento', rank: '#', name: 'Nome',
  course: 'Curso', overdue: 'Vencidos', risks: 'Riscos',
  recommendations: 'Recomendacoes', actionPlan: 'Plano de acao',
}

export const INSIGHTS_PDF_LABELS: Record<ReportsAnalyticsLocale, Record<string, string>> = {
  en: EN,
  es: ES,
  pt: PT,
}
