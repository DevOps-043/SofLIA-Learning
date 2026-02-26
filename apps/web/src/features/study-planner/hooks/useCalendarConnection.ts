/**
 * useCalendarConnection Hook
 *
 * Encapsula toda la lógica de conexión, desconexión y verificación de estado
 * de calendarios externos (Google Calendar, Microsoft Outlook).
 *
 * Principios:
 * - Single Responsibility: Solo maneja el ciclo de vida de la conexión OAuth.
 * - Open/Closed: Extensible mediante callbacks (onSuccess, onError, onStatusMessage).
 * - Dependency Inversion: No depende de estado de conversación ni del motor de análisis.
 *
 * Extraído de StudyPlannerLIA.tsx (Fase 1 - Refactorización V3).
 */

import { useState, useCallback, useRef } from 'react';

// =============================================================================
// TYPES
// =============================================================================

export type CalendarProvider = 'google' | 'microsoft';

export interface CalendarConnectionState {
  /** Proveedor conectado actualmente (null si no hay conexión) */
  connectedCalendar: CalendarProvider | null;
  /** Si se está en proceso de conectar/desconectar */
  isConnecting: boolean;
  /** Si el usuario saltó la conexión explícitamente */
  calendarSkipped: boolean;
  /** Si el modal de calendario está visible */
  showCalendarModal: boolean;
}

export interface CalendarConnectionCallbacks {
  /** Callback cuando la conexión fue exitosa. Recibe el provider conectado. */
  onConnected?: (provider: CalendarProvider) => void;
  /** Callback para agregar mensajes al chat de LIA */
  onStatusMessage?: (message: string, role: 'assistant' | 'system') => void;
  /** Callback cuando ocurre un error */
  onError?: (error: string) => void;
  /** Callback cuando el usuario salta la conexión */
  onSkipped?: () => void;
}

export interface CalendarConnectionActions {
  /** Conectar calendario por redirección directa (API route) */
  handleCalendarConnect: (provider: CalendarProvider) => Promise<void>;
  /** Conectar Google Calendar via popup OAuth */
  connectGoogleCalendar: () => void;
  /** Conectar Microsoft Calendar via popup OAuth */
  connectMicrosoftCalendar: () => void;
  /** Desconectar calendario activo */
  disconnectCalendar: (provider: CalendarProvider) => Promise<void>;
  /** Saltar conexión de calendario */
  skipCalendarConnection: () => void;
  /** Mostrar/ocultar el modal de selección de calendario */
  setShowCalendarModal: (show: boolean) => void;
  /** Verificar estado actual del calendario contra la API */
  checkCalendarStatus: () => Promise<{ isConnected: boolean; provider: CalendarProvider | null }>;
}

// =============================================================================
// HELPER: Error Messages
// =============================================================================

/**
 * Obtiene un mensaje de error amigable basado en el tipo de error de OAuth.
 * Función pura, exportada para reuso.
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

// =============================================================================
// HELPER: Detect error type from message
// =============================================================================

function detectErrorType(errorType: string, errorMessage: string): string {
  if (errorType) return errorType;
  const msg = errorMessage.toLowerCase();
  if (msg.includes('usuario no autorizado') || msg.includes('test user')) {
    return 'test_mode_user_not_added';
  }
  if (msg.includes('verificación') || msg.includes('verification') || msg.includes('policy')) {
    return 'app_not_verified';
  }
  if (msg.includes('acceso denegado') || msg.includes('access denied')) {
    return 'access_denied';
  }
  return '';
}

// =============================================================================
// HELPER: Open OAuth Popup with polling
// =============================================================================

interface PopupOAuthConfig {
  authUrl: string;
  popupName: string;
  defaultProvider: CalendarProvider;
  onConnected: (provider: CalendarProvider) => void;
  onError: (friendlyMessage: string) => void;
  onStartConnecting: () => void;
  onStopConnecting: () => void;
  setShowModal: (show: boolean) => void;
}

function openOAuthPopup(config: PopupOAuthConfig): void {
  const {
    authUrl, popupName, defaultProvider,
    onConnected, onError, onStartConnecting, onStopConnecting, setShowModal
  } = config;

  onStartConnecting();
  setShowModal(false);

  const popup = window.open(
    authUrl,
    popupName,
    'width=600,height=700,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no'
  );

  if (!popup) {
    alert('Por favor, permite que se abran ventanas emergentes para este sitio y vuelve a intentar.');
    onStopConnecting();
    setShowModal(true);
    return;
  }

  let popupCheckInterval: NodeJS.Timeout | null = null;
  let hasCheckedAfterClose = false;
  const popupOpenTime = Date.now();

  // Verify calendar status and emit event
  const checkCalendarAndContinue = async (provider: CalendarProvider) => {
    if (hasCheckedAfterClose) return;
    hasCheckedAfterClose = true;

    if (popupCheckInterval) {
      clearInterval(popupCheckInterval);
      popupCheckInterval = null;
    }

    try {
      const response = await fetch('/api/study-planner/calendar/status');
      if (response.ok) {
        const data = await response.json();
        if (data.isConnected && data.provider) {
          onStopConnecting();
          onConnected(data.provider as CalendarProvider);
        } else {
          console.warn('⚠️ [Calendar] Calendario no encontrado en BD, reintentando en 1 segundo...');
          hasCheckedAfterClose = false;
          setTimeout(() => checkCalendarAndContinue(provider), 1000);
        }
      }
    } catch (error) {
      console.error('❌ [Calendar] Error verificando estado del calendario:', error);
      onStopConnecting();
    }
  };

  // Poll for popup closure
  popupCheckInterval = setInterval(() => {
    try {
      let isClosed = false;
      try {
        isClosed = popup.closed === true;
      } catch {
        // COOP blocks access, fallback after timeout
        if (Date.now() - popupOpenTime > 10000) {
          isClosed = true;
        }
      }
      if (isClosed && !hasCheckedAfterClose) {
        setTimeout(() => checkCalendarAndContinue(defaultProvider), 1500);
      }
    } catch {
      // Ignore COOP errors
    }
  }, 1000);

  // Safety timeout: 60s
  setTimeout(() => {
    if (popupCheckInterval) {
      clearInterval(popupCheckInterval);
      popupCheckInterval = null;
    }
    if (!hasCheckedAfterClose) {
      checkCalendarAndContinue(defaultProvider);
    }
  }, 60_000);

  // PostMessage fallback listener
  const messageListener = (event: MessageEvent) => {
    if (event.data?.type === 'calendar-connected') {
      if (popupCheckInterval) {
        clearInterval(popupCheckInterval);
        popupCheckInterval = null;
      }
      hasCheckedAfterClose = true;
      window.removeEventListener('message', messageListener);
      checkCalendarAndContinue(event.data.provider || defaultProvider);
      return;
    }

    if (event.data?.type === 'calendar-error') {
      console.error('❌ [Calendar] Error al conectar calendario:', event.data.error);
      if (popupCheckInterval) {
        clearInterval(popupCheckInterval);
        popupCheckInterval = null;
      }
      window.removeEventListener('message', messageListener);
      onStopConnecting();

      const detectedType = detectErrorType(event.data.errorType || '', event.data.error || '');
      const friendlyMsg = getCalendarErrorMessage(detectedType, event.data.error || 'Error desconocido');
      onError(friendlyMsg);
    }
  };

  window.addEventListener('message', messageListener);
}

// =============================================================================
// HOOK
// =============================================================================

export function useCalendarConnection(
  callbacks: CalendarConnectionCallbacks = {}
): CalendarConnectionState & CalendarConnectionActions {
  const { onConnected, onStatusMessage, onError, onSkipped } = callbacks;

  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------
  const [connectedCalendar, setConnectedCalendar] = useState<CalendarProvider | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [calendarSkipped, setCalendarSkipped] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  // Ref to track ongoing operations
  const operationRef = useRef(false);

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  /**
   * Conectar calendario usando la API route (redirect flow).
   * Útil para contextos donde no se necesita popup.
   */
  const handleCalendarConnect = useCallback(async (provider: CalendarProvider) => {
    try {
      setIsConnecting(true);
      const response = await fetch('/api/study-planner/calendar/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });

      if (!response.ok) {
        throw new Error('Error al iniciar la conexión');
      }

      const data = await response.json();

      if (data.success && data.data?.authUrl) {
        window.location.href = data.data.authUrl;
      }
    } catch (err) {
      console.error('Error conectando calendario:', err);
      setIsConnecting(false);
    }
  }, []);

  /**
   * Conectar Google Calendar via popup OAuth.
   */
  const connectGoogleCalendar = useCallback(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID
      || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

    if (!clientId || clientId.trim() === '') {
      alert('Error de configuración: La variable NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID no está configurada.\n\nPor favor, asegúrate de agregar esta variable en tu archivo .env.local con tu Google Client ID.');
      console.error('NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID no está configurado');
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const redirectUri = `${baseUrl}/api/study-planner/calendar/callback`;
    const scope = 'https://www.googleapis.com/auth/calendar.events.owned';

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${encodeURIComponent(JSON.stringify({ provider: 'google', returnUrl: window.location.href, usePopup: true }))}`;

    openOAuthPopup({
      authUrl,
      popupName: 'SOFLIAlia-ai-google-calendar-auth',
      defaultProvider: 'google',
      onConnected: (provider) => {
        setConnectedCalendar(provider);
        onStatusMessage?.(
          `¡Calendario de ${provider === 'google' ? 'Google' : 'Microsoft'} conectado exitosamente! Déjame analizar tu disponibilidad...`,
          'assistant'
        );
        onConnected?.(provider);
      },
      onError: (friendlyMsg) => {
        onStatusMessage?.(`No pude conectar tu calendario. ${friendlyMsg.split('\n\n')[0]}`, 'assistant');
        onError?.(friendlyMsg);
        alert(`Error al conectar calendario:\n\n${friendlyMsg}`);
      },
      onStartConnecting: () => setIsConnecting(true),
      onStopConnecting: () => setIsConnecting(false),
      setShowModal: setShowCalendarModal,
    });
  }, [onConnected, onStatusMessage, onError]);

  /**
   * Conectar Microsoft Calendar via popup OAuth.
   */
  const connectMicrosoftCalendar = useCallback(() => {
    const clientId = process.env.NEXT_PUBLIC_MICROSOFT_CALENDAR_CLIENT_ID
      || process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID
      || process.env.NEXT_PUBLIC_MICROSOFT_OAUTH_CLIENT_ID || '';

    if (!clientId || clientId.trim() === '') {
      alert('Error de configuración: La variable NEXT_PUBLIC_MICROSOFT_CALENDAR_CLIENT_ID no está configurada.\n\nPor favor, asegúrate de agregar esta variable en tu archivo .env.local con tu Microsoft Client ID.');
      console.error('NEXT_PUBLIC_MICROSOFT_CALENDAR_CLIENT_ID no está configurado');
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const redirectUri = `${baseUrl}/api/study-planner/calendar/callback`;
    const scope = 'offline_access Calendars.ReadWrite User.Read';

    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `state=${encodeURIComponent(JSON.stringify({ provider: 'microsoft', returnUrl: window.location.href, usePopup: true }))}`;

    openOAuthPopup({
      authUrl,
      popupName: 'microsoft-calendar-auth',
      defaultProvider: 'microsoft',
      onConnected: (provider) => {
        setConnectedCalendar(provider);
        onStatusMessage?.(
          `¡Calendario de ${provider === 'google' ? 'Google' : 'Microsoft'} conectado exitosamente! Déjame analizar tu disponibilidad...`,
          'assistant'
        );
        onConnected?.(provider);
      },
      onError: (friendlyMsg) => {
        onStatusMessage?.(`No pude conectar tu calendario. ${friendlyMsg.split('\n\n')[0]}`, 'assistant');
        onError?.(friendlyMsg);
        alert(`Error al conectar calendario:\n\n${friendlyMsg}`);
      },
      onStartConnecting: () => setIsConnecting(true),
      onStopConnecting: () => setIsConnecting(false),
      setShowModal: setShowCalendarModal,
    });
  }, [onConnected, onStatusMessage, onError]);

  /**
   * Desconectar calendario activo.
   */
  const disconnectCalendar = useCallback(async (provider: CalendarProvider) => {
    console.log('🔌 [disconnectCalendar] Iniciando desconexión de:', provider);
    try {
      setIsConnecting(true);

      const response = await fetch('/api/study-planner/calendar/disconnect', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });

      const data = await response.json();
      console.log('🔌 [disconnectCalendar] Respuesta:', { ok: response.ok, data });

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al desconectar el calendario');
      }

      setConnectedCalendar(null);
      setShowCalendarModal(false);
      console.log('✅ [disconnectCalendar] Estado actualizado: connectedCalendar = null');

      const disconnectMsg = `He desconectado tu calendario de ${provider === 'google' ? 'Google' : 'Microsoft'}. Puedes volver a conectarlo cuando lo desees.`;
      onStatusMessage?.(disconnectMsg, 'assistant');
    } catch (error) {
      console.error('❌ [disconnectCalendar] Error desconectando calendario:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido al desconectar el calendario';
      onStatusMessage?.(`No pude desconectar tu calendario. ${errorMsg}`, 'assistant');
      onError?.(errorMsg);
      alert(`Error al desconectar calendario:\n\n${errorMsg}`);
    } finally {
      setIsConnecting(false);
    }
  }, [onStatusMessage, onError]);

  /**
   * Saltar la conexión de calendario.
   * No requiere lógica de fetching de perfil (eso lo hace el componente consumidor).
   */
  const skipCalendarConnection = useCallback(() => {
    setShowCalendarModal(false);
    setCalendarSkipped(true);
    onSkipped?.();
  }, [onSkipped]);

  /**
   * Verificar estado actual del calendario contra la API.
   */
  const checkCalendarStatus = useCallback(async (): Promise<{
    isConnected: boolean;
    provider: CalendarProvider | null;
  }> => {
    try {
      const response = await fetch('/api/study-planner/calendar/status');
      if (response.ok) {
        const data = await response.json();
        if (data.isConnected && data.provider) {
          setConnectedCalendar(data.provider as CalendarProvider);
          return { isConnected: true, provider: data.provider as CalendarProvider };
        }
      }
    } catch (error) {
      console.error('❌ [checkCalendarStatus] Error:', error);
    }
    return { isConnected: false, provider: null };
  }, []);

  return {
    // State
    connectedCalendar,
    isConnecting,
    calendarSkipped,
    showCalendarModal,

    // Actions
    handleCalendarConnect,
    connectGoogleCalendar,
    connectMicrosoftCalendar,
    disconnectCalendar,
    skipCalendarConnection,
    setShowCalendarModal,
    checkCalendarStatus,
  };
}

export default useCalendarConnection;
