import type { CommonIssue } from '../../types';

export const businessPanelCoursesCommonIssues: CommonIssue[] = [
      {
        description: 'Modal de asignación no se cierra después de asignar',
        possibleCauses: [
          'Error en callback onSuccess no manejado',
          'Estado del modal no se actualiza correctamente',
          'Componente padre no recibe la señal de cierre'
        ],
        solutions: [
          'Verificar que onSuccess se ejecuta sin errores',
          'Revisar logs de consola para errores de React',
          'Refrescar la página y reintentar'
        ]
      },
      {
        description: 'Cursos no aparecen en el catálogo',
        possibleCauses: [
          'Organización no tiene cursos asignados',
          'Error en la API de cursos',
          'Filtros activos ocultando cursos'
        ],
        solutions: [
          'Verificar en Admin Panel que hay cursos asignados a la organización',
          'Revisar Network tab para errores en la API',
          'Limpiar filtros de búsqueda'
        ]
      }
    ];
