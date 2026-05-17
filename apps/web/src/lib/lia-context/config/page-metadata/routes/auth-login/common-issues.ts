import type { CommonIssue } from '../../types';

export const authLoginCommonIssues: CommonIssue[] = [
      {
        description: 'No puedo iniciar sesión',
        possibleCauses: [
          'Contraseña incorrecta',
          'Usuario no existe',
          'Cuenta bloqueada por muchos intentos'
        ],
        solutions: [
          'Usar "Olvidé mi contraseña"',
          'Verificar que la cuenta existe',
          'Esperar unos minutos e intentar de nuevo'
        ]
      },
      {
        description: 'OAuth no funciona',
        possibleCauses: [
          'Popup bloqueado por navegador',
          'Error de configuración OAuth',
          'Cookies de terceros bloqueadas'
        ],
        solutions: [
          'Permitir popups para este sitio',
          'Desactivar bloqueador de cookies de terceros',
          'Intentar con otro navegador'
        ]
      }
    ];
