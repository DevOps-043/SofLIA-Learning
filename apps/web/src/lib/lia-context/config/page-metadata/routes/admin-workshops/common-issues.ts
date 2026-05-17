import type { CommonIssue } from '../../types';

export const adminWorkshopsCommonIssues: CommonIssue[] = [
      {
        description: 'Zona horaria incorrecta en taller',
        possibleCauses: ['Navegador con timezone diferente', 'No se configuró timezone del taller'],
        solutions: ['Verificar timezone del navegador', 'Configurar timezone explícitamente']
      }
    ];
