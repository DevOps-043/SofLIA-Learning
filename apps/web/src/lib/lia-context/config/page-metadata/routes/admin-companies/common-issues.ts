import type { CommonIssue } from '../../types';

export const adminCompaniesCommonIssues: CommonIssue[] = [
      {
        description: 'Slug ya existe',
        possibleCauses: [
          'Otra empresa usa el mismo slug',
          'Empresa eliminada pero slug reservado'
        ],
        solutions: [
          'Elegir un slug diferente',
          'Verificar empresas eliminadas'
        ]
      }
    ];
