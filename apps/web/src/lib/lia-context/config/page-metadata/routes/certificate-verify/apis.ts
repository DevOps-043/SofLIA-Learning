import type { ApiInfo } from '../../types';

export const certificateVerifyApis: ApiInfo[] = [
      {
        endpoint: '/api/certificates/verify',
        method: 'POST',
        description: 'Verifica autenticidad de certificado',
        commonErrors: ['404: Código no encontrado']
      }
    ];
