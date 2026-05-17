import type { UserFlow } from '../../types';

export const adminAccessRequestsUserFlows: UserFlow[] = [
      {
        name: 'Procesar solicitud',
        steps: ['1. Ver lista de solicitudes', '2. Revisar perfil del solicitante', '3. Aprobar o rechazar', '4. Enviar notificación'],
        commonBreakpoints: ['Paso 3: Error al actualizar']
      }
    ];
