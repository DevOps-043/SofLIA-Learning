import type { CommonIssue } from '../../types';

export const adminUsersCommonIssues: CommonIssue[] = [
      {
        description: 'No se puede eliminar usuario',
        possibleCauses: [
          'Usuario tiene datos dependientes',
          'Usuario es admin protegido',
          'Error en cascade delete'
        ],
        solutions: [
          'Verificar que el usuario no sea admin principal',
          'Eliminar datos relacionados primero',
          'Verificar logs para errores específicos'
        ]
      }
    ];
