import type { ComponentInfo } from '../../types';

export const businessPanelCoursesComponents: ComponentInfo[] = [
      {
        name: 'BusinessCoursesPage',
        path: 'apps/web/src/app/[orgSlug]/business-panel/courses/page.tsx',
        description: 'Página principal del catálogo de cursos para asignar a usuarios',
        props: [],
        commonErrors: [
          'Cursos no cargan: Verificar API GET /api/[orgSlug]/business/courses',
          'Error 403: Usuario sin permisos de administrador de business-panel',
          'Grid vacío: No hay cursos disponibles para la organización'
        ]
      },
      {
        name: 'BusinessAssignCourseModal',
        path: 'apps/web/src/features/business-panel/components/BusinessAssignCourseModal.tsx',
        description: 'Modal para asignar cursos a usuarios individuales o equipos',
        props: ['courseId', 'courseName', 'onClose', 'onSuccess'],
        commonErrors: [
          'Validación de fechas falla: fecha_inicio debe ser menor que fecha_limite',
          'Error al asignar: Verificar permisos del usuario y que los usuarios existan',
          'Modal no cierra: Error en callback onSuccess o estado no se actualiza',
          'Usuarios no cargan: Verificar API de usuarios de la organización'
        ]
      },
      {
        name: 'SofLIADeadlineSuggestionModal',
        path: 'apps/web/src/features/business-panel/components/LiaDeadlineSuggestionModal.tsx',
        description: 'Modal de sugerencias de fechas límite con IA',
        props: ['courseId', 'courseDuration', 'onSelectDate', 'onClose'],
        commonErrors: [
          'Sugerencias no cargan: Error en API de sugerencias',
          'Fechas incorrectas: Verificar duración del curso'
        ]
      }
    ];
