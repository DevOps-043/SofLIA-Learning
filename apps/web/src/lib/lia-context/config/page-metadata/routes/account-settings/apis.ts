import type { ApiInfo } from '../../types';

export const accountSettingsApis: ApiInfo[] = [
      {
        endpoint: '/api/account-settings',
        method: 'GET',
        description: 'Obtiene configuración de cuenta',
        commonErrors: ['401: No autenticado']
      },
      {
        endpoint: '/api/account-settings',
        method: 'PUT',
        description: 'Actualiza configuración',
        commonErrors: ['400: Datos inválidos']
      }
    ];
