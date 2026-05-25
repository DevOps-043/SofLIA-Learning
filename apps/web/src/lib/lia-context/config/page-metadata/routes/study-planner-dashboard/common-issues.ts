import type { CommonIssue } from '../../types';

export const studyPlannerDashboardCommonIssues: CommonIssue[] = [
      {
        description: 'SofLIA no genera un plan adecuado',
        possibleCauses: [
          'Preferencias no claras',
          'No hay suficientes lecciones pendientes',
          'Horarios muy restrictivos'
        ],
        solutions: [
          'Ser más específico con días y horarios disponibles',
          'Verificar que hay cursos asignados con lecciones pendientes',
          'Ampliar disponibilidad horaria'
        ]
      },
      {
        description: 'Calendario no sincroniza',
        possibleCauses: [
          'Token de OAuth expirado',
          'Permisos insuficientes',
          'Calendario bloqueado por políticas de empresa'
        ],
        solutions: [
          'Desconectar y volver a conectar el calendario',
          'Verificar que se otorgaron todos los permisos solicitados',
          'Contactar IT si hay restricciones empresariales'
        ]
      },
      {
        description: 'Plan no se guarda',
        possibleCauses: [
          'Error de conexión',
          'Plan tiene conflictos con calendario',
          'Sesión expirada'
        ],
        solutions: [
          'Verificar conexión a internet',
          'Revisar que no haya conflictos de horarios',
          'Refrescar página e intentar de nuevo'
        ]
      }
    ];
