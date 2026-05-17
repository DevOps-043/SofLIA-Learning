import type { UserFlow } from '../../types';

export const adminUsersUserFlows: UserFlow[] = [
      {
        name: 'Buscar y editar usuario',
        steps: [
          '1. Usar el buscador para encontrar el usuario',
          '2. Click en el usuario en la tabla',
          '3. Modificar campos en el modal de edición',
          '4. Guardar cambios'
        ],
        commonBreakpoints: [
          'Paso 2: Modal no abre',
          'Paso 4: Error al guardar'
        ]
      },
      {
        name: 'Eliminar usuario',
        steps: [
          '1. Buscar el usuario',
          '2. Click en botón de eliminar',
          '3. Confirmar en el diálogo',
          '4. Usuario eliminado'
        ],
        commonBreakpoints: [
          'Paso 3: Error de permisos',
          'Paso 4: Error eliminando datos relacionados'
        ]
      }
    ];
