import type { UserFlow } from '../../types';

export const businessUserAnalyticsUserFlows: UserFlow[] = [
  {
    name: 'Revisar tu progreso y métricas de aprendizaje',
    steps: [
      '1. Observar las tarjetas de resumen (progreso, adopción de IA, calidad)',
      '2. Revisar el gráfico de progreso por curso',
      '3. Consultar el resumen de aprendizaje (lecciones, tiempo invertido, certificados)',
    ],
    commonBreakpoints: ['Paso 1: las métricas aparecen en 0 si no hay actividad en el rango'],
  },
  {
    name: 'Cambiar el rango de tiempo (30, 90, 180 o 365 días)',
    steps: [
      '1. Ubicar los botones de rango en la parte superior derecha',
      '2. Seleccionar el período deseado',
      '3. Los datos se recargan automáticamente para ese período',
    ],
    commonBreakpoints: [],
  },
  {
    name: 'Generar retroalimentación personalizada con SofLIA',
    steps: [
      '1. Ir al panel de "Retroalimentación"',
      '2. Pulsar "Generar retroalimentación"',
      '3. Leer fortalezas, oportunidades, recomendaciones y próximos pasos',
    ],
    commonBreakpoints: ['Paso 2: el servicio de IA puede no estar disponible temporalmente'],
  },
  {
    name: 'Analizar tu uso de SofLIA y la calidad de tus preguntas',
    steps: [
      '1. Revisar el panel de adopción de IA',
      '2. Consultar el radar de calidad por dimensión',
    ],
    commonBreakpoints: [],
  },
  {
    name: 'Consultar tu actividad diaria en el mapa (heatmap)',
    steps: [
      '1. Bajar al panel de mapa de actividad',
      '2. Identificar los días con más actividad de aprendizaje',
    ],
    commonBreakpoints: [],
  },
  {
    name: 'Refrescar los datos o volver al dashboard',
    steps: [
      '1. Usar el botón "Actualizar" para recargar las métricas',
      '2. Usar la flecha de regreso para volver al dashboard',
    ],
    commonBreakpoints: [],
  },
];
