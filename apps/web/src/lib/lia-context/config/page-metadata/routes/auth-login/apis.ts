import type { ApiInfo } from '../../types';

export const authLoginApis: ApiInfo[] = [
      {
        endpoint: '/api/auth/callback',
        method: 'POST',
        description: 'Procesa login con Supabase Auth',
        commonErrors: [
          '401 Unauthorized: Credenciales inválidas',
          '429 Too Many Requests: Muchos intentos'
        ]
      }
    ];
