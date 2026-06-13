import type { ComponentInfo } from '../../types';

export const businessUserAnalyticsComponents: ComponentInfo[] = [
  {
    name: 'Tarjetas de resumen',
    path: 'apps/web/src/features/business-panel/components/business-user-analytics/BusinessUserAnalyticsPageClient.tsx',
    description:
      'Tres indicadores principales: progreso promedio en cursos, adopción de IA (uso de SofLIA) y calidad de tu aprendizaje.',
    props: [],
    commonErrors: [
      'Indicadores en 0: aún no hay actividad registrada en el rango seleccionado',
    ],
  },
  {
    name: 'Progreso por curso',
    path: 'apps/web/src/features/business-panel/components/business-user-analytics/BusinessUserAnalyticsPageClient.tsx',
    description:
      'Gráfico que muestra tu porcentaje de avance en cada curso asignado, ordenado de mayor a menor.',
    props: [],
    commonErrors: ['Gráfico vacío: no tienes cursos asignados o con avance'],
  },
  {
    name: 'Resumen de aprendizaje',
    path: 'apps/web/src/features/business-panel/components/business-user-analytics/BusinessUserAnalyticsPageClient.tsx',
    description:
      'Lecciones completadas, tiempo invertido, certificados obtenidos y el detalle de tus cursos con su estado.',
    props: [],
    commonErrors: [],
  },
  {
    name: 'Adopción de IA (SofLIA)',
    path: 'apps/web/src/features/business-panel/components/business-user-analytics/BusinessUserAnalyticsPageClient.tsx',
    description:
      'Métricas de cómo usas a SofLIA: tasa de preguntas, calidad de tus preguntas, preguntas fuera de tema y tendencia de participación.',
    props: [],
    commonErrors: [],
  },
  {
    name: 'Radar de calidad',
    path: 'apps/web/src/features/business-panel/components/business-user-analytics/BusinessUserAnalyticsPageClient.tsx',
    description:
      'Gráfico de radar que compara tu desempeño en cursos, actividades, uso de SofLIA, notas y quizzes.',
    props: [],
    commonErrors: [],
  },
  {
    name: 'Retroalimentación con IA',
    path: 'apps/web/src/features/business-panel/components/business-user-analytics/BusinessUserAnalyticsPageClient.tsx',
    description:
      'Panel donde SofLIA genera un análisis personalizado con fortalezas, oportunidades, recomendaciones y próximos pasos a partir de tus datos.',
    props: [],
    commonErrors: [
      'No genera: el servicio de IA no está disponible temporalmente, reintentar',
    ],
  },
  {
    name: 'Mapa de actividad (heatmap)',
    path: 'apps/web/src/features/business-panel/components/business-user-analytics/BusinessUserAnalyticsHeatmap.tsx',
    description:
      'Calendario tipo contribución que muestra los días en que tuviste actividad de aprendizaje.',
    props: ['cells', 'locale'],
    commonErrors: [],
  },
];
