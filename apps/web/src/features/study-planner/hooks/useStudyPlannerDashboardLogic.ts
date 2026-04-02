'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStudyPlannerDashboardSofLIA } from './useStudyPlannerDashboardSofLIA';
import { useStudyPlannerDashboardTour } from './useStudyPlannerDashboardTour';

export function useStudyPlannerDashboardLogic() {
  const router = useRouter();

  // Hook para el chat con SofLIA
  const {
    messages,
    isSending,
    error,
    sendMessage,
    clearMessages,
    clearError,
  } = useStudyPlannerDashboardSofLIA();

  // Hook del Tour
  const { restartTour, joyrideProps } = useStudyPlannerDashboardTour();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Estado para el panel de LIA (derecha) - abierto por defecto
  const [isLiaPanelOpen, setIsLiaPanelOpen] = useState(true);
  const [isLiaCollapsed, setIsLiaCollapsed] = useState(false);
  const liaPanelRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Estado para el input de mensaje
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll automático al último mensaje
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Refrescar calendario cuando SofLIA actualiza la selección de calendarios
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.actionType === 'update_calendar_selection' && lastMsg?.actionStatus === 'success') {
      setHasConfiguredCalendars(true);
      setCalendarRefreshTrigger(prev => prev + 1);
    }
  }, [messages]);

  // Estados para los iconos de acción
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [connectedProvider, setConnectedProvider] = useState<'google' | 'microsoft' | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState<'google' | 'microsoft' | null>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [isDeletingPlan, setIsDeletingPlan] = useState(false);
  const [isRecreatingPlan, setIsRecreatingPlan] = useState(false);
  const [showOnlyPlanEvents, setShowOnlyPlanEvents] = useState(false);
  const [isCalendarConfigOpen, setIsCalendarConfigOpen] = useState(false);
  const [hasConfiguredCalendars, setHasConfiguredCalendars] = useState(false);
  const [calendarRefreshTrigger, setCalendarRefreshTrigger] = useState(0);

  // Estado para notificaciones toast
  const [toast, setToast] = useState<{
    isOpen: boolean;
    message: string;
    type: 'error' | 'success' | 'info';
  }>({
    isOpen: false,
    message: '',
    type: 'error',
  });

  // Estado para modal de confirmación
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  }>({
    isOpen: false,
    message: '',
    onConfirm: () => { },
    onCancel: () => { },
  });

  // Verificar estado de conexión al cargar
  useEffect(() => {
    checkCalendarConnection();
  }, []);


  const checkCalendarConnection = async () => {
    try {
      const response = await fetch('/api/study-planner/calendar/status');
      if (response.ok) {
        const data = await response.json();
        setIsGoogleConnected(data.isConnected);
        setConnectedProvider(data.provider || null);

        // Verificar si ya configuró calendarios (si tiene selected_calendar_ids guardados)
        if (data.isConnected) {
          try {
            const selResponse = await fetch('/api/study-planner/calendar/selection');
            if (selResponse.ok) {
              const selData = await selResponse.json();
              setHasConfiguredCalendars(
                selData.success && selData.data?.selectedCalendarIds?.length > 0
              );
            }
          } catch {
            // No bloquear si falla la verificación de selección
          }
        }
      }
    } catch (error) {
      console.error('Error verificando conexión:', error);
    }
  };

  const handleConnect = async (provider: 'google' | 'microsoft') => {
    setConnectingProvider(provider);
    setIsConnecting(true);
    setCalendarError(null);

    try {
      const response = await fetch('/api/study-planner/calendar/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.authUrl) {
          // Construir URL con usePopup en el state
          const baseUrl = window.location.origin;
          let authUrl = data.data.authUrl;

          // Modificar el state para incluir usePopup
          try {
            const url = new URL(authUrl);
            const stateParam = url.searchParams.get('state');

            let stateData: any;
            if (stateParam) {
              // Intentar decodificar el state (puede estar codificado)
              try {
                // Primero intentar parsear directamente (puede no estar codificado)
                stateData = JSON.parse(stateParam);
              } catch {
                // Si falla, intentar decodificar primero
                try {
                  stateData = JSON.parse(decodeURIComponent(stateParam));
                } catch {
                  // Si aún falla, intentar decodificar dos veces
                  try {
                    stateData = JSON.parse(decodeURIComponent(decodeURIComponent(stateParam)));
                  } catch {
                    // Si todo falla, crear un nuevo state
                    console.warn('No se pudo parsear el state, creando uno nuevo');
                    stateData = { provider };
                  }
                }
              }
            } else {
              // Si no hay state, crear uno nuevo
              stateData = { provider };
            }

            // Agregar usePopup y returnUrl (sobrescribir si ya existen)
            stateData.usePopup = true;
            stateData.returnUrl = window.location.href;

            // Codificar el state actualizado (sin doble codificación)
            url.searchParams.set('state', JSON.stringify(stateData));
            authUrl = url.toString();

          } catch (e) {
            console.error('❌ Error modificando la URL:', e);
            // Si falla, intentar construir la URL manualmente
            const separator = authUrl.includes('?') ? '&' : '?';
            const stateData = {
              provider,
              returnUrl: window.location.href,
              usePopup: true
            };
            authUrl = `${authUrl}${separator}state=${encodeURIComponent(JSON.stringify(stateData))}`;

          }

          // Abrir popup
          const popup = window.open(
            authUrl,
            `${provider}-calendar-auth`,
            'width=600,height=700,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no'
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

          // Bandera para evitar procesar el mismo mensaje múltiples veces
          let messageProcessed = false;
          let checkClosed: NodeJS.Timeout | null = null;

          // Escuchar mensajes del popup
          const messageListener = (event: MessageEvent) => {
            // Verificar origen para seguridad
            const isSameOrigin = event.origin === baseUrl ||
              event.origin === window.location.origin ||
              event.origin.includes(window.location.hostname);

            if (!isSameOrigin) {
              console.warn('Mensaje rechazado por origen diferente:', event.origin);
              return;
            }

            if (event.data && event.data.type === 'calendar-connected') {
              if (messageProcessed) {

                return;
              }
              messageProcessed = true;

              const connectedProvider = event.data.provider || provider;

              // Limpiar listeners
              window.removeEventListener('message', messageListener);
              if (checkClosed) {
                clearInterval(checkClosed);
                checkClosed = null;
              }

              // Cerrar popup si aún está abierto
              if (popup && !popup.closed) {
                try {
                  popup.close();
                } catch (e) {
                  console.warn('No se pudo cerrar el popup:', e);
                }
              }

              // Actualizar estado
              setIsConnecting(false);
              setConnectingProvider(null);
              setIsGoogleConnected(true);
              setConnectedProvider(connectedProvider as 'google' | 'microsoft');
              setIsCalendarModalOpen(false);

            } else if (event.data && event.data.type === 'calendar-error') {
              console.error('Error al conectar calendario:', event.data.error);

              // Limpiar listeners
              window.removeEventListener('message', messageListener);
              if (checkClosed) {
                clearInterval(checkClosed);
                checkClosed = null;
              }

              // Intentar cerrar popup
              if (popup) {
                try {
                  if (typeof popup.closed === 'boolean' && !popup.closed) {
                    popup.close();
                  }
                } catch (e) {

                }
              }

              setIsConnecting(false);
              setConnectingProvider(null);
              setCalendarError(event.data.error || 'Error desconocido al conectar el calendario');
            }
          };

          // Agregar listener
          window.addEventListener('message', messageListener);

          // Verificar si el popup se cerró manualmente
          checkClosed = setInterval(() => {
            if (popup.closed) {
              if (checkClosed) {
                clearInterval(checkClosed);
                checkClosed = null;
              }
              window.removeEventListener('message', messageListener);
              if (!messageProcessed) {
                setIsConnecting(false);
                setConnectingProvider(null);
              }
            }
          }, 500);

        } else {
          setCalendarError('Error al iniciar la conexión');
          setIsConnecting(false);
          setConnectingProvider(null);
        }
      } else {
        setCalendarError('Error al conectar el calendario');
        setIsConnecting(false);
        setConnectingProvider(null);
      }
    } catch (error) {
      console.error('Error conectando calendario:', error);
      setCalendarError('Error al conectar el calendario');
      setIsConnecting(false);
      setConnectingProvider(null);
    }
  };

  const handleDisconnect = async () => {
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
        setIsCalendarModalOpen(false);
      } else {
        setCalendarError('Error al desconectar el calendario');
      }
    } catch (error) {
      console.error('Error desconectando calendario:', error);
      setCalendarError('Error al desconectar el calendario');
    }
  };

  // Función para eliminar el plan actual
  const handleDeletePlan = () => {
    setConfirmDialog({
      isOpen: true,
      message: '¿Estás seguro de que deseas eliminar tu plan de estudio? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        await performDeletePlan();
      },
      onCancel: () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  const performDeletePlan = async () => {
    setIsDeletingPlan(true);
    try {
      const response = await fetch('/api/study-planner/plan', {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        setToast({
          isOpen: true,
          message: data.message || 'Plan eliminado exitosamente',
          type: 'success',
        });
        // Recargar la página para actualizar el calendario después de un breve delay
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        const errorData = await response.json();
        setToast({
          isOpen: true,
          message: errorData.error || 'Error al eliminar el plan',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error eliminando plan:', error);
      setToast({
        isOpen: true,
        message: 'Error al eliminar el plan',
        type: 'error',
      });
    } finally {
      setIsDeletingPlan(false);
    }
  };

  // Función para eliminar plan anterior y redirigir a create
  const handleRecreatePlan = () => {
    setConfirmDialog({
      isOpen: true,
      message: '¿Estás seguro de que deseas eliminar tu plan actual y crear uno nuevo?',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        await performRecreatePlan();
      },
      onCancel: () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  const performRecreatePlan = async () => {
    setIsRecreatingPlan(true);
    try {
      // Eliminar el plan anterior si existe
      const response = await fetch('/api/study-planner/plan', {
        method: 'DELETE',
      });

      if (response.ok) {
        // Redirigir a la página de creación
        router.push('/study-planner/create');
      } else {
        const errorData = await response.json();
        // Si no hay plan, igual redirigir a create
        if (errorData.message?.includes('No hay plan')) {
          router.push('/study-planner/create');
        } else {
          setToast({
            isOpen: true,
            message: errorData.error || 'Error al eliminar el plan anterior',
            type: 'error',
          });
          setIsRecreatingPlan(false);
        }
      }
    } catch (error) {
      console.error('Error recreando plan:', error);
      setToast({
        isOpen: true,
        message: 'Error al recrear el plan',
        type: 'error',
      });
      // Intentar redirigir de todas formas
      setTimeout(() => {
        router.push('/study-planner/create');
      }, 2000);
    }
  };

  // Función para enviar mensaje
  const handleSendMessage = async () => {
    if (message.trim() && !isSending) {
      const messageToSend = message;
      setMessage('');
      if (messageInputRef.current) {
        messageInputRef.current.style.height = 'auto';
      }
      await sendMessage(messageToSend);
    }
  };

  return {
    // SofLIA chat
    messages,
    isSending,
    error,
    clearMessages,
    clearError,
    // Tour
    restartTour,
    joyrideProps,
    isMounted,
    // LIA panel
    isLiaPanelOpen,
    setIsLiaPanelOpen,
    isLiaCollapsed,
    setIsLiaCollapsed,
    liaPanelRef,
    messagesEndRef,
    // Message input
    message,
    setMessage,
    isRecording,
    setIsRecording,
    messageInputRef,
    // Calendar connection
    isCalendarModalOpen,
    setIsCalendarModalOpen,
    isGoogleConnected,
    connectedProvider,
    isConnecting,
    connectingProvider,
    hoveredButton,
    setHoveredButton,
    calendarError,
    // Plan state
    isDeletingPlan,
    isRecreatingPlan,
    showOnlyPlanEvents,
    setShowOnlyPlanEvents,
    isCalendarConfigOpen,
    setIsCalendarConfigOpen,
    hasConfiguredCalendars,
    setHasConfiguredCalendars,
    calendarRefreshTrigger,
    setCalendarRefreshTrigger,
    // Toast
    toast,
    setToast,
    // Confirm dialog
    confirmDialog,
    // Handlers
    handleConnect,
    handleDisconnect,
    handleDeletePlan,
    handleRecreatePlan,
    handleSendMessage,
  };
}
