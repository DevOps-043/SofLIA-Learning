import type { CommonIssue } from '../../types';

export const adminLiaAnalyticsCommonIssues: CommonIssue[] = [
      {
        description: 'Métricas no actualizadas',
        possibleCauses: [
          'Proceso de agregación no ejecutado',
          'Datos pendientes de procesar'
        ],
        solutions: [
          'Esperar al siguiente ciclo de agregación',
          'Verificar jobs de procesamiento'
        ]
      }
    ];
