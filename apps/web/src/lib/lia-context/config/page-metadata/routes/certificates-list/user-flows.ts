import type { UserFlow } from '../../types';

export const certificatesListUserFlows: UserFlow[] = [
      {
        name: 'Descargar certificado',
        steps: ['1. Encontrar certificado en la lista', '2. Click en "Descargar"', '3. PDF se descarga'],
        commonBreakpoints: ['Paso 3: PDF no genera']
      },
      {
        name: 'Compartir certificado',
        steps: ['1. Click en "Compartir"', '2. Copiar link o compartir en red social'],
        commonBreakpoints: ['Paso 2: Link no funciona']
      }
    ];
