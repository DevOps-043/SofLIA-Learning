'use client';

import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useCallback, useState } from 'react';

interface UseStudyPlannerCalendarConnectionResult {
  isGoogleConnected: boolean;
  connectedProvider: 'google' | 'microsoft' | null;
  isConnecting: boolean;
  connectingProvider: 'google' | 'microsoft' | null;
  calendarError: string | null;
  hasConfiguredCalendars: boolean;
  setIsGoogleConnected: React.Dispatch<React.SetStateAction<boolean>>;
  setConnectedProvider: React.Dispatch<React.SetStateAction<'google' | 'microsoft' | null>>;
  setHasConfiguredCalendars: React.Dispatch<React.SetStateAction<boolean>>;
  setCalendarError: React.Dispatch<React.SetStateAction<string | null>>;
  checkCalendarConnection: () => Promise<void>;
  handleConnect: (provider: 'google' | 'microsoft', onSuccess?: () => void) => Promise<void>;
  handleDisconnect: () => Promise<void>;
}

interface ToastSetter {
  (value: { isOpen: boolean; message: string; type: 'error' | 'success' | 'info' }): void;
}

export function useStudyPlannerCalendarConnection(
  setToast: ToastSetter,
): UseStudyPlannerCalendarConnectionResult {
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [connectedProvider, setConnectedProvider] = useState<'google' | 'microsoft' | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState<'google' | 'microsoft' | null>(null);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [hasConfiguredCalendars, setHasConfiguredCalendars] = useState(false);

  const checkCalendarConnection = useCallback(async () => {
    try {
      const response = await fetch('/api/study-planner/calendar/status');
      if (!response.ok) return;

      const data = await response.json();
      setIsGoogleConnected(data.isConnected);
      setConnectedProvider(data.provider || null);
      if (!data.isConnected) return;

      try {
        const selResponse = await fetch('/api/study-planner/calendar/selection');
        if (!selResponse.ok) return;
        const selData = await selResponse.json();
        setHasConfiguredCalendars(
          selData.success && selData.data?.selectedCalendarIds?.length > 0,
        );
      } catch {
        // Keep planner usable if selection lookup fails.
      }
    } catch (connectionError) {
      techDebtLogger.error('Error verificando conexión:', connectionError);
    }
  }, []);

  const handleConnect = useCallback(
    async (provider: 'google' | 'microsoft', onSuccess?: () => void) => {
      setConnectingProvider(provider);
      setIsConnecting(true);
      setCalendarError(null);

      try {
        const response = await fetch('/api/study-planner/calendar/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider }),
        });

        if (!response.ok) {
          setCalendarError('Error al conectar el calendario');
          setIsConnecting(false);
          setConnectingProvider(null);
          return;
        }

        const data = await response.json();
        if (!data.success || !data.data?.authUrl) {
          setCalendarError('Error al iniciar la conexión');
          setIsConnecting(false);
          setConnectingProvider(null);
          return;
        }

        const baseUrl = window.location.origin;
        let authUrl: string = data.data.authUrl;

        try {
          const url = new URL(authUrl);
          const stateParam = url.searchParams.get('state');
          let stateData: Record<string, unknown>;
          if (stateParam) {
            try {
              stateData = JSON.parse(stateParam);
            } catch {
              stateData = JSON.parse(decodeURIComponent(stateParam));
            }
          } else {
            stateData = { provider };
          }
          stateData.usePopup = true;
          stateData.returnUrl = window.location.href;
          url.searchParams.set('state', JSON.stringify(stateData));
          authUrl = url.toString();
        } catch {
          const sep = authUrl.includes('?') ? '&' : '?';
          authUrl = `${authUrl}${sep}state=${encodeURIComponent(JSON.stringify({ provider, returnUrl: window.location.href, usePopup: true }))}`;
        }

        const popup = window.open(
          authUrl,
          `${provider}-calendar-auth`,
          'width=600,height=700,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no',
        );

        if (!popup) {
          setToast({
            isOpen: true,
            message: 'Por favor, permite que se abran ventanas emergentes para este sitio y vuelve a intentar.',
            type: 'error',
          });
          setIsConnecting(false);
          setConnectingProvider(null);
          return;
        }

        let messageProcessed = false;
        let checkClosed: NodeJS.Timeout | null = null;

        const messageListener = (event: MessageEvent) => {
          const isSameOrigin =
            event.origin === baseUrl
            || event.origin === window.location.origin
            || event.origin.includes(window.location.hostname);
          if (!isSameOrigin) return;

          if (event.data?.type === 'calendar-connected') {
            if (messageProcessed) return;
            messageProcessed = true;
            window.removeEventListener('message', messageListener);
            if (checkClosed) clearInterval(checkClosed);
            if (!popup.closed) popup.close();
            setIsConnecting(false);
            setConnectingProvider(null);
            setIsGoogleConnected(true);
            setConnectedProvider((event.data.provider || provider) as 'google' | 'microsoft');
            onSuccess?.();
          }

          if (event.data?.type === 'calendar-error') {
            window.removeEventListener('message', messageListener);
            if (checkClosed) clearInterval(checkClosed);
            if (!popup.closed) popup.close();
            setIsConnecting(false);
            setConnectingProvider(null);
            setCalendarError(event.data.error || 'Error desconocido al conectar el calendario');
          }
        };

        window.addEventListener('message', messageListener);

        checkClosed = setInterval(() => {
          if (!popup.closed) return;
          if (checkClosed) clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          if (!messageProcessed) {
            setIsConnecting(false);
            setConnectingProvider(null);
          }
        }, 500);
      } catch (connectionError) {
        techDebtLogger.error('Error conectando calendario:', connectionError);
        setCalendarError('Error al conectar el calendario');
        setIsConnecting(false);
        setConnectingProvider(null);
      }
    },
    [setToast],
  );

  const handleDisconnect = useCallback(async () => {
    if (!connectedProvider) return;
    try {
      const response = await fetch('/api/study-planner/calendar/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: connectedProvider }),
      });
      if (response.ok) {
        setIsGoogleConnected(false);
        setConnectedProvider(null);
        setHasConfiguredCalendars(false);
        setCalendarError(null);
      } else {
        setCalendarError('Error al desconectar el calendario');
      }
    } catch (err) {
      techDebtLogger.error('Error desconectando calendario:', err);
      setCalendarError('Error al desconectar el calendario');
    }
  }, [connectedProvider]);

  return {
    isGoogleConnected, connectedProvider, isConnecting, connectingProvider,
    calendarError, hasConfiguredCalendars,
    setIsGoogleConnected, setConnectedProvider, setHasConfiguredCalendars, setCalendarError,
    checkCalendarConnection, handleConnect, handleDisconnect,
  };
}
