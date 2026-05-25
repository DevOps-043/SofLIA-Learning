import type { ComponentInfo } from '../../types';

export const businessPanelUsersComponents: ComponentInfo[] = [
      {
        name: 'BusinessUsersPage',
        path: 'apps/web/src/app/[orgSlug]/business-panel/users/page.tsx',
        description: 'Página de gestión de usuarios de la organización',
        props: [],
        commonErrors: [
          'Lista de usuarios no carga: Error en API de usuarios',
          'Error 403: Sin permisos de administrador'
        ]
      },
      {
        name: 'BusinessAddUserModal',
        path: 'apps/web/src/features/business-panel/components/BusinessAddUserModal.tsx',
        description: 'Modal para agregar nuevos usuarios a la organización',
        props: ['onClose', 'onSuccess'],
        commonErrors: [
          'Error al crear usuario: Email ya existe',
          'Validación falla: Campos requeridos vacíos'
        ]
      },
      {
        name: 'BusinessUserStatsModal',
        path: 'apps/web/src/features/business-panel/components/BusinessUserStatsModal.tsx',
        description: 'Modal con estadísticas detalladas de un usuario',
        props: ['userId', 'userName', 'onClose'],
        commonErrors: [
          'Estadísticas no cargan: Error en API de stats',
          'Gráficos no se renderizan: Error en datos'
        ]
      },
      {
        name: 'BusinessImportUsersModal',
        path: 'apps/web/src/features/business-panel/components/BusinessImportUsersModal.tsx',
        description: 'Modal para importar usuarios masivamente via CSV',
        props: ['onClose', 'onSuccess'],
        commonErrors: [
          'Archivo no se procesa: Formato CSV incorrecto',
          'Errores de validación: Emails duplicados o inválidos'
        ]
      }
    ];
