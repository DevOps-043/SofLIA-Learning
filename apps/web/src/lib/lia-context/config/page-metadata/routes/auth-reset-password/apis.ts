import type { ApiInfo } from '../../types';

export const authResetPasswordApis: ApiInfo[] = [
      {
        endpoint: '/api/auth/reset-password',
        method: 'PUT',
        description: 'Actualiza contraseña con token',
        commonErrors: ['400: Token expirado', '400: Contraseña inválida']
      }
    ];
