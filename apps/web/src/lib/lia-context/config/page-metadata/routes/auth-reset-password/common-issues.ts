import type { CommonIssue } from '../../types';

export const authResetPasswordCommonIssues: CommonIssue[] = [
      {
        description: 'Link de recuperación no funciona',
        possibleCauses: ['Token expirado (válido por 1 hora)', 'Link ya usado'],
        solutions: ['Solicitar nuevo link de recuperación']
      }
    ];
