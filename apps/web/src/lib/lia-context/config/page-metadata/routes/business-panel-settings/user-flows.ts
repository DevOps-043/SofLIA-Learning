import type { UserFlow } from '../../types';

export const businessPanelSettingsUserFlows: UserFlow[] = [
      {
        name: 'Actualizar configuración',
        steps: [
          '1. Modificar campos deseados',
          '2. Subir nuevo logo si es necesario',
          '3. Configurar colores de marca',
          '4. Guardar cambios'
        ],
        commonBreakpoints: [
          'Paso 2: Error subiendo imagen',
          'Paso 4: Error guardando'
        ]
      }
    ];
