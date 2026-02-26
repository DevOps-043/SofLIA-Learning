/**
 * Obtiene un mensaje de error amigable basado en el tipo de error de OAuth
 */
export function getCalendarErrorMessage(errorType: string, errorMsg: string): string {
  switch (errorType) {
    case 'email_mismatch':
      return '⚠️ El calendario conectado pertenece a otra cuenta.\n\nEl email con el que iniciaste sesión en Google/Microsoft no coincide con tu cuenta en la aplicación.\n\nPara solucionarlo:\n1. Cierra sesión en Google/Microsoft en tu navegador\n2. Inicia sesión con el mismo email que usas aquí\n3. Vuelve a intentar conectar tu calendario';

    case 'test_mode_user_not_added':
      return 'Tu email no está agregado como usuario de prueba.\n\n⚠️ IMPORTANTE: El email debe coincidir EXACTAMENTE con el que usas para iniciar sesión en Google.\n\nPara solucionarlo:\n1. Ve a Google Cloud Console (console.cloud.google.com)\n2. Ve a "APIs & Services" > "OAuth consent screen"\n3. En "Test users", haz clic en "+ ADD USERS"\n4. Agrega tu email EXACTO (el mismo que usas para Google) y guarda\n5. Espera 1-2 minutos para que se apliquen los cambios\n6. Intenta conectar de nuevo';

    case 'app_not_verified':
      return 'La aplicación requiere configuración en Google Cloud Console.\n\nPara solucionarlo:\n1. Ve a Google Cloud Console\n2. Ve a "APIs & Services" > "OAuth consent screen"\n3. Cambia el estado a "Testing" (modo de prueba)\n4. Agrega tu email como usuario de prueba\n5. Intenta conectar de nuevo';

    case 'access_denied':
      return 'No se otorgaron los permisos necesarios.\n\nAsegúrate de aceptar todos los permisos cuando Google los solicite e intenta de nuevo.';

    case 'redirect_uri_mismatch':
      return 'Error de configuración: URI de redirección incorrecta.\n\nVerifica que en Google Cloud Console > Credentials tengas configurada la URI correcta.';

    case 'invalid_client':
      return 'El Client ID no es válido.\n\nVerifica que NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID esté configurado correctamente en tu archivo .env.local';

    case 'code_expired':
      return 'El código de autorización expiró.\n\nEsto puede pasar si el proceso tarda mucho. Simplemente intenta conectar de nuevo.';

    case 'rls_error':
      return 'Error de permisos en la base de datos.\n\nNo se pudo guardar la integración. Este es un error del servidor. Por favor, contacta al administrador.';

    default:
      // Detectar errores conocidos por el contenido del mensaje
      if (errorMsg.includes("doesn't comply with Google's OAuth 2.0 policy") ||
        errorMsg.includes('OAuth 2.0 policy') ||
        errorMsg.includes('comply with Google')) {
        return 'Tu aplicación de Google requiere configuración.\n\nPara solucionarlo:\n1. Ve a Google Cloud Console\n2. Cambia tu app a modo de prueba (Testing)\n3. Agrega tu email como usuario de prueba\n4. Intenta conectar de nuevo';
      }
      if (errorMsg.includes('connection_failed')) {
        return 'No se pudo conectar el calendario.\n\nVerifica tu configuración de OAuth en Google Cloud Console y que tu email esté agregado como usuario de prueba.';
      }
      return errorMsg || 'Error desconocido al conectar el calendario. Por favor, intenta de nuevo.';
  }
}
