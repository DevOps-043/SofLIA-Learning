import type { CommonIssue } from '../../types';

export const authRegisterCommonIssues: CommonIssue[] = [
      {
        description: 'Email de verificación no llega',
        possibleCauses: ['Email en spam', 'Email incorrecto', 'Delay en envío'],
        solutions: ['Revisar carpeta de spam', 'Verificar email ingresado', 'Reenviar email de verificación']
      }
    ];
