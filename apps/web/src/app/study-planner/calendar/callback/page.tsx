'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * Obtiene el mensaje de ayuda específico según el tipo de error
 */
function getErrorHelp(errorType: string): { title: string; message: string; steps: string[] } {
  switch (errorType) {
    case 'test_mode_user_not_added':
      return {
        title: 'Usuario no autorizado en modo de prueba',
        message: 'Tu email no está agregado como usuario de prueba en la aplicación de Google.',
        steps: [
          'Ve a Google Cloud Console (console.cloud.google.com)',
          'Selecciona tu proyecto',
          'Ve a "APIs & Services" > "OAuth consent screen"',
          'En la sección "Test users", haz clic en "+ ADD USERS"',
          'Agrega tu email y guarda los cambios',
          'Intenta conectar de nuevo'
        ]
      };
    case 'app_not_verified':
      return {
        title: 'Aplicación requiere configuración',
        message: 'La aplicación de Google necesita estar configurada correctamente.',
        steps: [
          'Ve a Google Cloud Console (console.cloud.google.com)',
          'Ve a "APIs & Services" > "OAuth consent screen"',
          'Si la app está en "Production", cámbiala a "Testing" (modo de prueba)',
          'Agrega tu email como usuario de prueba en "Test users"',
          'Verifica que los scopes incluyan "calendar.readonly"',
          'Intenta conectar de nuevo'
        ]
      };
    case 'access_denied':
      return {
        title: 'Acceso denegado',
        message: 'No se otorgaron los permisos necesarios para acceder al calendario.',
        steps: [
          'Intenta conectar de nuevo',
          'Cuando Google solicite permisos, asegúrate de aceptar todos',
          'Si rechazaste los permisos, Google puede bloquear solicitudes futuras temporalmente',
          'Espera unos minutos e intenta de nuevo'
        ]
      };
    case 'redirect_uri_mismatch':
      return {
        title: 'Error de configuración: URI de redirección',
        message: 'La URI de redirección no coincide con la configurada en Google Cloud Console.',
        steps: [
          'Ve a Google Cloud Console > "APIs & Services" > "Credentials"',
          'Edita tu OAuth 2.0 Client ID',
          'En "Authorized redirect URIs", agrega: ' + window.location.origin + '/api/study-planner/calendar/callback',
          'Guarda los cambios y espera unos minutos',
          'Intenta conectar de nuevo'
        ]
      };
    case 'invalid_client':
      return {
        title: 'Client ID inválido',
        message: 'El Client ID de Google no es válido o no está configurado.',
        steps: [
          'Verifica que NEXT_PUBLIC_GOOGLE_CLIENT_ID esté configurado en .env.local',
          'El Client ID debe coincidir con el de Google Cloud Console',
          'Reinicia el servidor después de cambiar variables de entorno'
        ]
      };
    case 'code_expired':
      return {
        title: 'Código expirado',
        message: 'El código de autorización ha expirado. Esto puede pasar si el proceso tarda mucho.',
        steps: [
          'Simplemente intenta conectar de nuevo',
          'El proceso debería completarse automáticamente'
        ]
      };
    case 'rls_error':
      return {
        title: 'Error de permisos en base de datos',
        message: 'No se pudo guardar la integración debido a políticas de seguridad.',
        steps: [
          'Este es un error del servidor',
          'Contacta al administrador del sistema',
          'Verifica que SUPABASE_SERVICE_ROLE_KEY esté configurada correctamente'
        ]
      };
    default:
      return {
        title: 'Error de conexión',
        message: 'Ocurrió un error al conectar con el calendario.',
        steps: [
          'Verifica tu conexión a internet',
          'Intenta conectar de nuevo',
          'Si el problema persiste, revisa la configuración en Google Cloud Console'
        ]
      };
  }
}

/**
 * Página de callback para OAuth de calendario
 * Esta página se carga cuando el OAuth redirige después de la autenticación
 * Si viene de un popup, envía un mensaje a la ventana padre y se cierra
 */
export default function CalendarCallbackPage() {
  const searchParams = useSearchParams();
  const [showError, setShowError] = useState<{
    type: string;
    description: string;
    help: { title: string; message: string; steps: string[] };
  } | null>(null);
  const [calendarConnected, setCalendarConnected] = useState(false);

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Verificar si venimos de un popup
    let isPopup = false;
    try {
      if (state) {
        const stateData = JSON.parse(state);
        isPopup = stateData.usePopup === true;
      }
    } catch {
      // Si no se puede parsear el state, asumimos que no es popup
    }

    // Si hay un error, enviar mensaje de error
    if (error) {
      const errorHelp = getErrorHelp(error);
      
      if (isPopup && window.opener) {
        window.opener.postMessage(
          {
            type: 'calendar-error',
            error: errorDescription || error,
            errorType: error,
            provider: state ? (() => {
              try {
                const stateData = JSON.parse(state);
                return stateData.provider;
              } catch {
                return null;
              }
            })() : null,
          },
          window.location.origin
        );
        // Cerrar el popup después de un breve delay
        setTimeout(() => {
          try {
            window.close();
            // Si no se puede cerrar (por COOP), mostrar mensaje detallado al usuario
            setTimeout(() => {
              if (!document.hidden) {
                setShowError({
                  type: error,
                  description: errorDescription || error,
                  help: errorHelp
                });
              }
            }, 500);
          } catch (e) {
            console.error('Error cerrando popup:', e);
            setShowError({
              type: error,
              description: errorDescription || error,
              help: errorHelp
            });
          }
        }, 500);
      } else {
        // Si no es popup, mostrar error con ayuda o redirigir
        setShowError({
          type: error,
          description: errorDescription || error,
          help: errorHelp
        });
      }
      return;
    }

    // Verificar si la conexión fue exitosa (el servidor ya procesó todo)
    const success = searchParams.get('success') === 'true';
    const provider = searchParams.get('provider') || 'google';

    // Parsear el provider del state
    let providerFromState = provider;
    try {
      if (state) {
        const stateData = JSON.parse(state);
        providerFromState = stateData.provider || provider;
      }
    } catch {
      // Usar el provider de la URL
    }

    if (success && state && isPopup && window.opener) {

      // Si es popup, la conexión ya se procesó en el servidor
      // Solo necesitamos notificar al padre
      try {
        window.opener.postMessage(
          {
            type: 'calendar-connected',
            provider: providerFromState,
          },
          window.location.origin
        );

      } catch (e) {
        console.error('[Calendar Callback] Error enviando mensaje:', e);
      }

      // Enviar el mensaje varias veces para asegurarse de que llegue
      const sendMessage = () => {
        try {
          window.opener.postMessage(
            {
              type: 'calendar-connected',
              provider: providerFromState,
            },
            window.location.origin
          );
        } catch (e) {
          console.error('[Calendar Callback] Error enviando mensaje:', e);
        }
      };

      // Enviar inmediatamente
      sendMessage();
      
      // Enviar de nuevo después de un pequeño delay (por si acaso)
      setTimeout(sendMessage, 100);
      setTimeout(sendMessage, 300);

      // Cerrar el popup después de dar tiempo al mensaje
      setTimeout(() => {

        try {
          window.close();
        } catch (e) {
          console.error('[Calendar Callback] Error cerrando popup:', e);
          setCalendarConnected(true);
        }
      }, 1000);
    } else if (code && state && !success && isPopup) {
      // Si tenemos code pero no success, el servidor debe procesarlo primero
      // Redirigir al servidor para que lo procese

      window.location.href = `/api/study-planner/calendar/callback?code=${code}&state=${encodeURIComponent(state)}`;
    } else if (success && !isPopup) {
      // Si no es popup, redirigir normalmente
      window.location.href = `/study-planner/create?calendar_connected=${providerFromState}`;
    } else if (!code && !success) {
      console.warn('[Calendar Callback] No hay código ni éxito, posible error en el flujo');
    }
  }, [searchParams]);

  // Si hay error, mostrar pantalla de error con ayuda
  if (showError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          {/* Icono de error */}
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          
          {/* Título y mensaje */}
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-2">
            {showError.help.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-4">
            {showError.help.message}
          </p>
          
          {/* Pasos para solucionar */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
              Pasos para solucionarlo:
            </h3>
            <ol className="text-sm text-blue-700 dark:text-blue-200 space-y-1 list-decimal list-inside">
              {showError.help.steps.map((step, index) => (
                <li key={index} className="leading-relaxed">{step}</li>
              ))}
            </ol>
          </div>
          
          {/* Detalle técnico */}
          {showError.description && showError.description !== showError.type && (
            <details className="mb-4">
              <summary className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200">
                Ver detalle técnico
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-x-auto text-gray-600 dark:text-gray-300">
                {showError.description}
              </pre>
            </details>
          )}
          
          {/* Botones */}
          <div className="flex gap-3">
            <button
              onClick={() => window.close()}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cerrar ventana
            </button>
            <button
              onClick={() => window.location.href = '/study-planner/create'}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Volver al planificador
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar mensaje mientras se procesa
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        {calendarConnected ? (
          <>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-700 dark:text-gray-300 font-medium">
              Calendario conectado exitosamente.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Puedes cerrar esta ventana.
            </p>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-700 dark:text-gray-300">
              Conectando tu calendario...
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Esta ventana se cerrará automáticamente
            </p>
          </>
        )}
      </div>
    </div>
  );
}

