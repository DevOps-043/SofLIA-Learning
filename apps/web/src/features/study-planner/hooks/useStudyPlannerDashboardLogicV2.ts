'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStudyPlannerDashboardSofLIA } from './useStudyPlannerDashboardSofLIA';
import { useStudyPlannerCalendarConnection } from './useStudyPlannerCalendarConnection';
import { useStudyPlannerPlanManagement } from './useStudyPlannerPlanManagement';

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
  const selectedPlanIdRef = useRef<string | null>(null);

  const {
    activePlan, messages, isSending, error,
    sendMessage, executeAction, clearMessages, clearError,
  } = useStudyPlannerDashboardSofLIA(selectedPlanId);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

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
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [isDeletingPlan, setIsDeletingPlan] = useState(false);
  const [isRecreatingPlan, setIsRecreatingPlan] = useState(false);
  const [showOnlyPlanEvents, setShowOnlyPlanEvents] = useState(false);
  const [isCalendarConfigOpen, setIsCalendarConfigOpen] = useState(false);
  const [calendarRefreshTrigger, setCalendarRefreshTrigger] = useState(0);

  const [toast, setToast] = useState<{
    isOpen: boolean;
    message: string;
    type: 'error' | 'success' | 'info';
  }>({ isOpen: false, message: '', type: 'error' });

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  }>({ isOpen: false, message: '', onConfirm: () => {}, onCancel: () => {} });

  const syncPlanSelectionInUrl = useCallback(
    (planId: string | null) => {
      if (typeof window === 'undefined') return;
      const url = new URL(window.location.href);
      if (planId) url.searchParams.set('planId', planId);
      else url.searchParams.delete('planId');
      router.replace(`${url.pathname}${url.search}`, { scroll: false });
    },
    [router],
  );

  const {
    isGoogleConnected, connectedProvider, isConnecting, connectingProvider,
    calendarError, hasConfiguredCalendars,
    setIsGoogleConnected, setConnectedProvider, setHasConfiguredCalendars, setCalendarError,
    checkCalendarConnection, handleConnect, handleDisconnect,
  } = useStudyPlannerCalendarConnection(setToast);

  const { loadPlans, handleDeletePlan } = useStudyPlannerPlanManagement({
    selectedPlanId,
    selectedPlanIdRef,
    setSelectedPlanId,
    setAvailablePlans,
    availablePlans,
    setIsDeletingPlan,
    setToast,
    setConfirmDialog,
    syncPlanSelectionInUrl,
  });

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.actionType === 'update_calendar_selection' && lastMsg?.actionStatus === 'success') {
      setHasConfiguredCalendars(true);
      setCalendarRefreshTrigger((prev) => prev + 1);
    }
  }, [messages, setHasConfiguredCalendars]);

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

  const handleRecreatePlan = () => {
    setIsRecreatingPlan(true);
    router.push('/study-planner/create');
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return;
    const messageToSend = message;
    setMessage('');
    if (messageInputRef.current) messageInputRef.current.style.height = 'auto';
    await sendMessage(messageToSend);
  };

  return {
    activePlan, availablePlans, messages, isSending, error,
    clearMessages, clearError,
    isMounted,
    isLiaPanelOpen, setIsLiaPanelOpen,
    isLiaCollapsed, setIsLiaCollapsed,
    liaPanelRef, messagesEndRef,
    message, setMessage,
    isRecording, setIsRecording,
    messageInputRef,
    isCalendarModalOpen, setIsCalendarModalOpen,
    isGoogleConnected, connectedProvider,
    isConnecting, connectingProvider,
    hoveredButton, setHoveredButton,
    calendarError,
    isDeletingPlan, isRecreatingPlan,
    showOnlyPlanEvents, setShowOnlyPlanEvents,
    isCalendarConfigOpen, setIsCalendarConfigOpen,
    hasConfiguredCalendars, setHasConfiguredCalendars,
    calendarRefreshTrigger, setCalendarRefreshTrigger,
    selectedPlanId,
    toast, setToast,
    confirmDialog,
    executeAction,
    handleConnect: (provider: 'google' | 'microsoft') =>
      handleConnect(provider, () => setIsCalendarModalOpen(false)),
    handleDisconnect: async () => {
      await handleDisconnect();
      setIsCalendarModalOpen(false);
    },
    handleDeletePlan,
    handlePlanSelection,
    handleRecreatePlan,
    handleSendMessage,
  };
}
