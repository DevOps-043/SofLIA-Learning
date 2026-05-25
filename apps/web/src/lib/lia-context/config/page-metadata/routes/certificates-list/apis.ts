import type { ApiInfo } from '../../types';

export const certificatesListApis: ApiInfo[] = [
      {
        endpoint: '/api/certificates',
        method: 'GET',
        description: 'Obtiene certificados del usuario',
        commonErrors: ['401: No autenticado']
      },
      {
        endpoint: '/api/certificates/[id]',
        method: 'GET',
        description: 'Obtiene certificado específico',
        commonErrors: ['404: Certificado no encontrado']
      }
    ];
