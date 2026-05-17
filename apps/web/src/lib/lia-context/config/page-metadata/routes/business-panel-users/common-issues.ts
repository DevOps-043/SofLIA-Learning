import type { CommonIssue } from '../../types';

export const businessPanelUsersCommonIssues: CommonIssue[] = [
      {
        description: 'Usuario no recibe email de invitación',
        possibleCauses: [
          'Email en carpeta de spam',
          'Error en servicio de emails',
          'Email incorrecto'
        ],
        solutions: [
          'Verificar carpeta de spam del usuario',
          'Reenviar invitación desde el panel',
          'Verificar que el email esté escrito correctamente'
        ]
      },
      {
        description: 'Importación CSV falla',
        possibleCauses: [
          'Formato de archivo incorrecto',
          'Columnas no coinciden con plantilla',
          'Emails duplicados en el archivo'
        ],
        solutions: [
          'Usar la plantilla CSV proporcionada',
          'Verificar que las columnas estén en orden correcto',
          'Eliminar duplicados del archivo'
        ]
      }
    ];
