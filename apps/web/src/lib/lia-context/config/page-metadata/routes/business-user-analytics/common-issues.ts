import type { CommonIssue } from '../../types';

export const businessUserAnalyticsCommonIssues: CommonIssue[] = [
  {
    description: 'Las métricas aparecen en cero o vacías',
    possibleCauses: [
      'Aún no hay actividad registrada en el rango de tiempo seleccionado',
      'El usuario no tiene cursos asignados o no ha iniciado lecciones',
    ],
    solutions: [
      'Ampliar el rango de tiempo (por ejemplo, a 365 días)',
      'Comenzar o continuar un curso asignado para generar datos',
    ],
  },
  {
    description: 'No se genera la retroalimentación con IA',
    possibleCauses: [
      'El servicio de IA no está disponible temporalmente',
      'No hay suficientes datos para generar el análisis',
    ],
    solutions: [
      'Reintentar pulsando nuevamente "Generar retroalimentación"',
      'Acumular más actividad de aprendizaje y volver a intentar',
    ],
  },
];
