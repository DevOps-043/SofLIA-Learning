import type { CommonIssue } from '../../types';

export const mainDashboardCommonIssues: CommonIssue[] = [
      {
        description: 'No veo mis cursos',
        possibleCauses: ['No hay cursos adquiridos', 'Error de carga', 'Filtros aplicados'],
        solutions: ['Adquirir un curso', 'Refrescar página', 'Limpiar filtros']
      }
    ];
