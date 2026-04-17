'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStudyPlannerDashboardSofLIA } from './useStudyPlannerDashboardSofLIA';
import { useStudyPlannerDashboardTour } from './useStudyPlannerDashboardTour';
import { resolveInitialStudyPlannerPlanId } from '../services/study-planner-navigation.service';

interface DashboardPlanListItem {
  dashboardDestination?: string;
  id: string;
  name: string;
  organizationId?: string;
  organizationRole?: string;
  organizationSlug?: string;
  primaryCourseTitle?: string;
  totalSessions: number;
  upcomingSessions: number;
}

export function useStudyPlannerDashboardLogicV2() {
  const router = useRouter();
  const [availablePlans, setAvailablePlans] = useState<DashboardPlanListItem[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  // Ref to read current selectedPlanId inside callbacks without making them depend on it
  const selectedPlanIdRef = useRef<string | null>(null);

  const {
    activePlan,
    messages,
    isSending,
    error,
    sendMessage,
    clearMessages,
    clearError,
  } = useStudyPlannerDashboardSofLIA(selectedPlanId);

  const { restartTour, joyrideProps } = useStudyPlannerDashboardTour();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [isLiaPanelOpen, setIsLiaPanelOpen] = useState(true);
  const [isLiaCollapsed, setIsLiaCollapsed] = useState(false);
  const liaPanelRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

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

  const [toast, setToast] = useState<{
    isOpen: boolean;
    message: string;
    type: 'error' | 'success' | 'info';
  }>({
    isOpen: false,
    message: '',
    type: 'error',
  });

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  }>({
    isOpen: false,
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
  });

  const syncPlanSelectionInUrl = useCallback((planId: string | null) => {
    if (typeof window === 'undefined') {
      return;
    }

    const url = new URL(window.location.href);
    if (planId) {
      url.searchParams.set('planId', planId);
    } else {
      url.searchParams.delete('planId');
    }

    router.replace(`${url.pathname}${url.search}`, { scroll: false });
  }, [router]);

  const loadPlans = useCallback(async (preferredPlanId?: string | null) => {
    try {
      const response = await fetch('/api/study-planner/plans');
      const payload = await response.json() as {
        success?: boolean;
        data?: DashboardPlanListItem[];
      };

      if (!response.ok || !payload.success) {
        return;
      }

      const plans = payload.data || [];
      setAvailablePlans(plans);

      const urlPlanId = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('planId')
        : null;
      const fromOrgSlug = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('fromOrg')
        : null;
      // Use the ref instead of state to avoid re-creating this callback on every plan change
      const nextPlanId = resolveInitialStudyPlannerPlanId({
        fromOrgSlug,
        plans,
        preferredPlanId,
        selectedPlanId: selectedPlanIdRef.current,
        urlPlanId,
      });

      selectedPlanIdRef.current = nextPlanId;
      setSelectedPlanId(nextPlanId);
      syncPlanSelectionInUrl(nextPlanId);
    } catch (plansError) {
      console.error('Error cargando planes:', plansError);
    }
  }, [syncPlanSelectionInUrl]); // selectedPlanId removed — read via ref to break the re-trigger loop

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.actionType === 'update_calendar_selection' && lastMsg?.actionStatus === 'success') {
      setHasConfiguredCalendars(true);
      setCalendarRefreshTrigger((previous) => previous + 1);
    }
  }, [messages]);

  const checkCalendarConnection = useCallback(async () => {
    try {
      const response = await fetch('/api/study-planner/calendar/status');
      if (!response.ok) {
        return;
      }

      const data = await response.json();
      setIsGoogleConnected(data.isConnected);
      setConnectedProvider(data.provider || null);

      if (!data.isConnected) {
        return;
      }

      try {
        const selResponse = await fetch('/api/study-planner/calendar/selection');
        if (!selResponse.ok) {
          return;
        }

        const selData = await selResponse.json();
        setHasConfiguredCalendars(
          selData.success && selData.data?.selectedCalendarIds?.length > 0,
        );
      } catch {
        // Keep planner usable if selection lookup fails.
      }
    } catch (connectionError) {
      console.error('Error verificando conexiÃ³n:', connectionError);
    }
  }, []);

  useEffect(() => {
    void checkCalendarConnection();
    void loadPlans();
  }, [checkCalendarConnection, loadPlans]);

  const handlePlanSelection = (planId: string) => {
    clearMessages();
    clearError();
    selectedPlanIdRef.current = planId;
    setSelectedPlanId(planId);
    syncPlanSelectionInUrl(planId);
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

      if (!response.ok) {
        setCalendarError('Error al conectar el calendario');
        setIsConnecting(false);
        setConnectingProvider(null);
        return;
      }

      const data = await response.json();
      if (!data.success || !data.data?.authUrl) {
        setCalendarError('Error al iniciar la conexiÃ³n');
        setIsConnecting(false);
        setConnectingProvider(null);
        return;
      }

      const baseUrl = window.location.origin;
      let authUrl = data.data.authUrl;

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
        const separator = authUrl.includes('?') ? '&' : '?';
        authUrl = `${authUrl}${separator}state=${encodeURIComponent(JSON.stringify({
          provider,
          returnUrl: window.location.href,
          usePopup: true,
        }))}`;
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

        if (!isSameOrigin) {
          return;
        }

        if (event.data?.type === 'calendar-connected') {
          if (messageProcessed) {
            return;
          }

          messageProcessed = true;
          window.removeEventListener('message', messageListener);
          if (checkClosed) {
            clearInterval(checkClosed);
          }

          if (!popup.closed) {
            popup.close();
          }

          setIsConnecting(false);
          setConnectingProvider(null);
          setIsGoogleConnected(true);
          setConnectedProvider((event.data.provider || provider) as 'google' | 'microsoft');
          setIsCalendarModalOpen(false);
        }

        if (event.data?.type === 'calendar-error') {
          window.removeEventListener('message', messageListener);
          if (checkClosed) {
            clearInterval(checkClosed);
          }

          if (!popup.closed) {
            popup.close();
          }

          setIsConnecting(false);
          setConnectingProvider(null);
          setCalendarError(event.data.error || 'Error desconocido al conectar el calendario');
        }
      };

      window.addEventListener('message', messageListener);

      checkClosed = setInterval(() => {
        if (!popup.closed) {
          return;
        }

        if (checkClosed) {
          clearInterval(checkClosed);
        }

        window.removeEventListener('message', messageListener);
        if (!messageProcessed) {
          setIsConnecting(false);
          setConnectingProvider(null);
        }
      }, 500);
    } catch (connectionError) {
      console.error('Error conectando calendario:', connectionError);
      setCalendarError('Error al conectar el calendario');
      setIsConnecting(false);
      setConnectingProvider(null);
    }
  };

  const handleDisconnect = async () => {
    if (!connectedProvider) {
      return;
    }

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
    } catch (disconnectionError) {
      console.error('Error desconectando calendario:', disconnectionError);
      setCalendarError('Error al desconectar el calendario');
    }
  };

  const handleDeletePlan = () => {
    const selectedPlan = availablePlans.find((plan) => plan.id === selectedPlanId);

    setConfirmDialog({
      isOpen: true,
      message: selectedPlan
        ? `Deseas eliminar el plan "${selectedPlan.name}"? Esta accion no se puede deshacer.`
        : 'Deseas eliminar este plan de estudio? Esta accion no se puede deshacer.',
      onConfirm: async () => {
        setConfirmDialog((previous) => ({ ...previous, isOpen: false }));
        await performDeletePlan();
      },
      onCancel: () => {
        setConfirmDialog((previous) => ({ ...previous, isOpen: false }));
      },
    });
  };

  const performDeletePlan = async () => {
    if (!selectedPlanId) {
      setToast({
        isOpen: true,
        message: 'Selecciona un plan antes de intentar eliminarlo.',
        type: 'error',
      });
      return;
    }

    setIsDeletingPlan(true);
    try {
      const response = await fetch(
        `/api/study-planner/plan?planId=${encodeURIComponent(selectedPlanId)}`,
        { method: 'DELETE' },
      );

      if (!response.ok) {
        const errorData = await response.json();
        setToast({
          isOpen: true,
          message: errorData.error || 'Error al eliminar el plan',
          type: 'error',
        });
        return;
      }

      const data = await response.json();
      setToast({
        isOpen: true,
        message: data.message || 'Plan eliminado exitosamente',
        type: 'success',
      });

      const fallbackPlanId =
        availablePlans.find((plan) => plan.id !== selectedPlanId)?.id || null;
      await loadPlans(fallbackPlanId);

      if (!fallbackPlanId) {
        router.push('/study-planner/create');
      }
    } catch (deleteError) {
      console.error('Error eliminando plan:', deleteError);
      setToast({
        isOpen: true,
        message: 'Error al eliminar el plan',
        type: 'error',
      });
    } finally {
      setIsDeletingPlan(false);
    }
  };

  const handleRecreatePlan = () => {
    setIsRecreatingPlan(true);
    router.push('/study-planner/create');
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) {
      return;
    }

    const messageToSend = message;
    setMessage('');
    if (messageInputRef.current) {
      messageInputRef.current.style.height = 'auto';
    }
    await sendMessage(messageToSend);
  };

  return {
    activePlan,
    availablePlans,
    messages,
    isSending,
    error,
    clearMessages,
    clearError,
    restartTour,
    joyrideProps,
    isMounted,
    isLiaPanelOpen,
    setIsLiaPanelOpen,
    isLiaCollapsed,
    setIsLiaCollapsed,
    liaPanelRef,
    messagesEndRef,
    message,
    setMessage,
    isRecording,
    setIsRecording,
    messageInputRef,
    isCalendarModalOpen,
    setIsCalendarModalOpen,
    isGoogleConnected,
    connectedProvider,
    isConnecting,
    connectingProvider,
    hoveredButton,
    setHoveredButton,
    calendarError,
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
    selectedPlanId,
    toast,
    setToast,
    confirmDialog,
    handleConnect,
    handleDisconnect,
    handleDeletePlan,
    handlePlanSelection,
    handleRecreatePlan,
    handleSendMessage,
  };
}
