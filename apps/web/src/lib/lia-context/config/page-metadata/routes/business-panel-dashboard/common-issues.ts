import type { CommonIssue } from '../../types';

export const businessPanelDashboardCommonIssues: CommonIssue[] = [
      {
        description: 'Dashboard sin datos',
        possibleCauses: [
          'Organización nueva sin usuarios',
          'Usuarios sin cursos asignados',
          'Error en cálculo de stats'
        ],
        solutions: [
          'Verificar que hay usuarios en la organización',
          'Asignar cursos a usuarios',
          'Esperar sincronización de datos'
        ]
      }
    ];
