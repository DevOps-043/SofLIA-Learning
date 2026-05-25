import type { ApiInfo } from '../../types';

export const authForgotPasswordApis: ApiInfo[] = [
      {
        endpoint: '/api/auth/reset-password',
        method: 'POST',
        description: 'Envía email de recuperación',
        commonErrors: ['404: Email no registrado']
      }
    ];
