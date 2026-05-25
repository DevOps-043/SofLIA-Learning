import type { CommonIssue } from '../../types';

export const userProfileCommonIssues: CommonIssue[] = [
      {
        description: 'Foto de perfil no se actualiza',
        possibleCauses: ['Cache del navegador', 'Imagen muy grande', 'Formato no soportado'],
        solutions: ['Limpiar cache', 'Usar imagen menor a 5MB', 'Usar formato JPG o PNG']
      }
    ];
