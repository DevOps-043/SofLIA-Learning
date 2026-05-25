import type { ApiInfo } from '../../types';

export const authRegisterApis: ApiInfo[] = [
      {
        endpoint: '/api/auth/callback',
        method: 'POST',
        description: 'Crea cuenta nueva en Supabase Auth',
        commonErrors: [
          '400 Bad Request: Email inválido',
          '409 Conflict: Email ya registrado'
        ]
      }
    ];
