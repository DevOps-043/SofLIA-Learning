import type { CommonIssue } from '../../types';

export const adminReportesCommonIssues: CommonIssue[] = [
      {
        description: 'Grabación de sesión no reproduce',
        possibleCauses: [
          'Datos de grabación corruptos',
          'Formato no compatible',
          'Grabación muy grande'
        ],
        solutions: [
          'Revisar metadata del reporte',
          'Verificar tamaño de grabación',
          'Usar información alternativa (screenshot, descripción)'
        ]
      }
    ];
