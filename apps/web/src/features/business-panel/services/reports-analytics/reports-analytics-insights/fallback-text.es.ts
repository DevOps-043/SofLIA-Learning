export const FALLBACK_TEXT_ES = {
  // Section titles
  learningTitle: 'Aprendizaje y finalizacion',
  adoptionTitle: 'Adopcion de IA y notas',
  qualityTitle: 'Calidad operativa y evaluaciones',

  // Metric labels
  metricProgress: 'Progreso y cierre',
  metricSoflia: 'Adopcion SofLIA',
  metricQuality: 'Calidad operativa',
  metricAtRisk: 'Usuarios en riesgo',
  metricActiveLearners: 'Aprendices activos',
  metricCompliance: 'Cumplimiento org.',

  // Action plan section titles
  actionPlanTitle: 'Prioridades inmediatas',
  actionPlanAtRiskTitle: 'Recuperacion y habitos de estudio',

  // Empty / no data messages
  noHierarchy: 'No hay jerarquia suficiente para comparar regiones, zonas o areas.',
  noRiskCourse: 'No hay cursos con senales criticas en el periodo filtrado.',
  noSegment: 'No hay segmentos suficientes para comparar calidad en este periodo.',
  noAgeBandData: 'Los datos de franja etaria no tienen informacion suficiente para este periodo.',

  // Recommendations (5)
  recommendSoflia: 'Refuerza el uso de SofLIA en los segmentos con menor adopcion y cruza el seguimiento con el avance de curso.',
  recommendHierarchy: 'Usa el cuadro de honor por region, zona y area para identificar y replicar las practicas de los equipos con mejor score.',
  recommendQuality: 'Revisa las actividades con baja calidad y alto uso de ayuda para ajustar instrucciones, ejemplos y criterios de evaluacion.',
  recommendPlanner: 'Activa recordatorios de sesion para los colaboradores con baja adherencia al planificador de estudio.',
  recommendInactive: 'Contacta directamente a los colaboradores sin actividad reciente con un mensaje personalizado de retorno al programa.',

  // Action plan items
  actionPlanSegment: 'Prioriza los segmentos con baja calidad o bajo avance antes de ampliar nuevas asignaciones.',
  actionPlanCourse: 'Revisa los cursos con mayor riesgo operativo y cruza avance, vencimientos y solicitudes de ayuda.',
  actionPlanData: 'Completa los datos demograficos faltantes para mejorar la precision estadistica del analisis de RRHH.',
  actionPlanAtRiskUsers: 'Asigna un seguimiento personalizado a cada colaborador identificado con riesgo alto o medio.',
  actionPlanPlannerLow: 'Implementa sesiones de onboarding del planificador de estudio con los equipos de menor adherencia.',

  // Summary — richer, no "Lectura automatica" framing
  summary: (quality: number, progress: number, atRisk: number, compliance: number) =>
    `La organizacion registra un progreso promedio del ${progress}% con una tasa de cumplimiento del ${compliance}%. La calidad operativa alcanza el ${quality}%${atRisk > 0 ? ` y ${atRisk} colaboradores estan en riesgo y requieren atencion prioritaria` : ''}.`,

  // Metric detail functions
  metricProgressDetail: (completion: number, days: number) =>
    `Finalizacion ${completion}% y mediana de cierre ${days} dias.`,
  metricSofliaDetail: (conversations: number, messages: number) =>
    `${conversations} conversaciones y ${messages} mensajes analizados.`,
  metricQualityDetail: (quiz: number, activity: number, soflia: number) =>
    `Evaluaciones ${quiz}%, actividades ${activity}% y SofLIA ${soflia}%.`,
  metricAtRiskDetail: (count: number, rate: number) =>
    `${count} colaboradores (${rate}%) con vencimientos, inactividad o progreso critico.`,
  metricActiveLearnerDetail: (count: number, rate: number) =>
    `${count} activos representan el ${rate}% de los colaboradores asignados.`,
  metricComplianceDetail: (rate: number) =>
    `${rate}% de asignados sin senales de riesgo en el periodo analizado.`,

  // Finding point functions
  learningPoint: (completion: number, days: number) =>
    `La finalizacion global es ${completion}% y el tiempo promedio de cierre es ${days} dias.`,
  riskCourse: (title: string, overdue: number) =>
    `"${title}" concentra riesgo operativo con ${overdue} vencimientos acumulados.`,
  adoptionPoint: (soflia: number, notes: number) =>
    `La adopcion de SofLIA es ${soflia}% y la adopcion de notas es ${notes}%.`,
  bestRegion: (name: string, score: number) =>
    `${name} lidera el ranking regional con score ${score}%.`,
  qualityPoint: (quality: number, offTopic: number) =>
    `El score de calidad es ${quality}% y la tasa de respuestas fuera de tema es ${offTopic}%.`,
  segmentPoint: (label: string, score: number) =>
    `La franja "${label}" muestra un score de calidad del ${score}% y requiere revision.`,

  // Risk functions (5)
  riskQuality: (help: number) =>
    `El ${help}% de los usuarios solicita ayuda en actividades, lo que puede indicar instrucciones poco claras o criterios de evaluacion mal calibrados.`,
  riskData: (completion: number) =>
    `Solo el ${completion}% de los perfiles demograficos esta completo. Los datos faltantes reducen la precision del analisis por segmento.`,
  riskInactive: (count: number) =>
    `${count} colaboradores con cursos asignados no han registrado actividad en los ultimos 14 dias y estan en riesgo de abandono.`,
  riskOverdue: (count: number) =>
    `${count} asignaciones vencidas acumuladas en el periodo, con impacto potencial en el cumplimiento normativo.`,
  riskLowPlanner: (rate: number) =>
    `La adherencia al planificador de estudio es del ${rate}%, por debajo del umbral recomendado del 60%.`,

  // Urgent action text (shown in urgentActions section)
  urgentAtRiskTitle: 'Colaboradores en riesgo sin seguimiento activo',
  urgentAtRiskDesc: (count: number) =>
    `${count} colaboradores presentan vencimientos, inactividad prolongada o progreso critico. Requieren un plan de recuperacion y contacto directo en los proximos dias.`,
  urgentAtRiskTimeline: '1-2 dias',
  urgentOverdueTitle: 'Vencimientos acumulados sin resolver',
  urgentOverdueDesc: (count: number) =>
    `${count} asignaciones vencidas detectadas en el periodo. Prioriza contacto con los responsables de area para acordar fechas de recuperacion.`,
  urgentOverdueTimeline: '3-5 dias',

  // Segment highlight text
  bestRegionHighlight: (name: string, score: number) =>
    `${name} lidera el ranking regional con ${score}% de score. Documentar sus practicas como modelo para el resto de la organizacion.`,
  worstRegionHighlight: (name: string, score: number) =>
    `${name} tiene el score regional mas bajo (${score}%). Se recomienda asignar acompanamiento especializado y revisar cargas de trabajo.`,
  bestTeamHighlight: (name: string, score: number) =>
    `El equipo "${name}" es el mejor posicionado con ${score}% de score y puede servir como referente de mejores practicas.`,
  worstTeamHighlight: (name: string, score: number) =>
    `El equipo "${name}" registra el score mas bajo (${score}%) y requiere intervencion directa del lider de area.`,

  // Kudos text
  kudoCompletionTitle: 'Tasa de finalizacion destacada',
  kudoCompletionDesc: (rate: number) =>
    `Con una tasa de finalizacion del ${rate}%, la organizacion supera el umbral saludable del 70%. Es un logro que vale la pena reconocer con los equipos.`,
  kudoQualityTitle: 'Calidad operativa solida',
  kudoQualityDesc: (score: number) =>
    `El score de calidad del ${score}% refleja compromiso con el aprendizaje y una evaluacion rigurosa en toda la organizacion.`,
  kudoAdoptionTitle: 'Alta adopcion de SofLIA',
  kudoAdoptionDesc: (rate: number) =>
    `El ${rate}% de adopcion de SofLIA indica que los colaboradores usan activamente la IA para reforzar y profundizar su aprendizaje.`,
}
