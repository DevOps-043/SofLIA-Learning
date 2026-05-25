import type { UserFlow } from '../../types';

export const adminWorkshopsUserFlows: UserFlow[] = [
      {
        name: 'Crear taller',
        steps: [
          '1. Click en "Nuevo Taller"',
          '2. Completar información básica (título, descripción)',
          '3. Configurar fecha y hora',
          '4. Agregar instructor',
          '5. Publicar taller'
        ],
        commonBreakpoints: [
          'Paso 3: Zona horaria incorrecta',
          'Paso 4: Instructor no encontrado'
        ]
      }
    ];
