import type { UserFlow } from '../../types';

export const businessPanelHierarchyUserFlows: UserFlow[] = [
      {
        name: 'Crear nuevo equipo',
        steps: [
          '1. Click en "Nuevo Equipo"',
          '2. Ingresar nombre del equipo',
          '3. Asignar líder (opcional)',
          '4. Agregar miembros',
          '5. Guardar equipo'
        ],
        commonBreakpoints: [
          'Paso 2: Nombre ya existe',
          'Paso 4: Usuarios no cargan'
        ]
      }
    ];
