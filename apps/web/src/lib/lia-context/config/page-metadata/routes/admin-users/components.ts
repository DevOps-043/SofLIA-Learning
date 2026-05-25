import type { ComponentInfo } from '../../types';

export const adminUsersComponents: ComponentInfo[] = [
      {
        name: 'AdminUsersPage',
        path: 'apps/web/src/app/admin/users/page.tsx',
        description: 'Gestión de usuarios de la plataforma',
        props: [],
        commonErrors: [
          'Lista de usuarios no carga: Error en API',
          'Búsqueda no funciona: Error en query de filtros'
        ]
      },
      {
        name: 'UsersTable',
        path: 'apps/web/src/features/admin/components/UsersTable.tsx',
        description: 'Tabla de usuarios con acciones',
        props: ['users', 'onEdit', 'onDelete', 'onViewStats'],
        commonErrors: [
          'Acciones no funcionan: Handler no configurado',
          'Paginación falla: Error en parámetros de página'
        ]
      }
    ];
