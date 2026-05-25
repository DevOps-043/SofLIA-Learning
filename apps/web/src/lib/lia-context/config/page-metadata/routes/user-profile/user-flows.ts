import type { UserFlow } from '../../types';

export const userProfileUserFlows: UserFlow[] = [
      {
        name: 'Actualizar perfil',
        steps: ['1. Modificar campos deseados', '2. Cambiar foto de perfil (opcional)', '3. Click en "Guardar"', '4. Ver confirmación'],
        commonBreakpoints: ['Paso 2: Imagen no sube', 'Paso 3: Error guardando']
      }
    ];
