import type { CommonIssue } from '../../types';

export const courseLearnCommonIssues: CommonIssue[] = [
      {
        description: 'Video no reproduce',
        possibleCauses: [
          'Conexión lenta o inestable',
          'Proveedor de video no disponible',
          'Navegador no compatible',
          'Extensiones bloqueando contenido'
        ],
        solutions: [
          'Verificar conexión a internet',
          'Probar en otro navegador',
          'Desactivar extensiones de adblock',
          'Refrescar la página'
        ]
      },
      {
        description: 'Progreso no se guarda',
        possibleCauses: [
          'Sesión expirada',
          'Error de red',
          'API de progreso fallando'
        ],
        solutions: [
          'Refrescar la página y volver a iniciar sesión',
          'Verificar conexión a internet',
          'Reportar el problema al soporte'
        ]
      },
      {
        description: 'SofLIA no responde en contexto de lección',
        possibleCauses: [
          'Transcripción del video no disponible',
          'Error en API de chat',
          'Límite de requests alcanzado'
        ],
        solutions: [
          'Esperar unos segundos y reintentar',
          'Verificar que la lección tenga transcripción',
          'Probar más tarde si hay límite de requests'
        ]
      }
    ];
