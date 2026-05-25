import type { ApiInfo } from '../../types';

export const businessPanelCoursesApis: ApiInfo[] = [
      {
        endpoint: '/api/[orgSlug]/business/courses',
        method: 'GET',
        description: 'Obtiene lista de cursos disponibles para la organización',
        commonErrors: [
          '403 Forbidden: Usuario sin permisos de business-panel',
          '500 Internal Error: Error en query de BD o organización no encontrada'
        ]
      },
      {
        endpoint: '/api/[orgSlug]/business/courses',
        method: 'POST',
        description: 'Asigna un curso a usuarios o equipos',
        commonErrors: [
          '400 Bad Request: Datos de asignación inválidos',
          '403 Forbidden: Sin permisos para asignar cursos',
          '404 Not Found: Curso o usuarios no encontrados'
        ]
      }
    ];
