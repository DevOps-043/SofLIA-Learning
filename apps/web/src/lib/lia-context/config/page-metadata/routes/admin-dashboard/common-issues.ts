import type { CommonIssue } from '../../types';

export const adminDashboardCommonIssues: CommonIssue[] = [
      {
        description: 'Estadísticas no se actualizan',
        possibleCauses: [
          'Cache del navegador',
          'Error en cálculo de stats',
          'Datos no sincronizados'
        ],
        solutions: [
          'Refrescar la página',
          'Limpiar cache del navegador',
          'Verificar logs del servidor'
        ]
      }
    ];
