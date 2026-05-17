import type { CommonIssue } from '../../types';

export const businessUserDashboardCommonIssues: CommonIssue[] = [
      {
        description: 'No aparecen cursos en el dashboard',
        possibleCauses: [
          'Usuario no tiene cursos asignados',
          'Cursos están ocultos o inactivos',
          'Error en la carga de datos'
        ],
        solutions: [
          'Contactar al administrador para asignar cursos',
          'Verificar en Network tab si hay errores de API',
          'Refrescar la página'
        ]
      },
      {
        description: 'Progreso no se guarda',
        possibleCauses: [
          'Problemas de conexión a internet',
          'Error en API de progreso',
          'Sesión expirada'
        ],
        solutions: [
          'Verificar conexión a internet',
          'Cerrar sesión y volver a iniciar',
          'Esperar unos segundos y reintentar'
        ]
      }
    ];
