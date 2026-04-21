'use client';

import { useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
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

interface ToastSetter {
  (value: { isOpen: boolean; message: string; type: 'error' | 'success' | 'info' }): void;
}

interface ConfirmDialogSetter {
  (value: {
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  }): void;
}

interface UseStudyPlannerPlanManagementParams {
  selectedPlanId: string | null;
  selectedPlanIdRef: React.MutableRefObject<string | null>;
  setSelectedPlanId: React.Dispatch<React.SetStateAction<string | null>>;
  setAvailablePlans: React.Dispatch<React.SetStateAction<DashboardPlanListItem[]>>;
  availablePlans: DashboardPlanListItem[];
  setIsDeletingPlan: React.Dispatch<React.SetStateAction<boolean>>;
  setToast: ToastSetter;
  setConfirmDialog: ConfirmDialogSetter;
  syncPlanSelectionInUrl: (planId: string | null) => void;
}

export function useStudyPlannerPlanManagement({
  selectedPlanId,
  selectedPlanIdRef,
  setSelectedPlanId,
  setAvailablePlans,
  availablePlans,
  setIsDeletingPlan,
  setToast,
  setConfirmDialog,
  syncPlanSelectionInUrl,
}: UseStudyPlannerPlanManagementParams) {
  const router = useRouter();

  const loadPlans = useCallback(
    async (preferredPlanId?: string | null) => {
      try {
        const response = await fetch('/api/study-planner/plans');
        const payload = (await response.json()) as {
          success?: boolean;
          data?: DashboardPlanListItem[];
        };

        if (!response.ok || !payload.success) return;

        const plans = payload.data || [];
        setAvailablePlans(plans);

        const urlPlanId =
          typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('planId')
            : null;
        const fromOrgSlug =
          typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('fromOrg')
            : null;

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
      } catch (error) {
        console.error('Error cargando planes:', error);
      }
    },
    [selectedPlanIdRef, setAvailablePlans, setSelectedPlanId, syncPlanSelectionInUrl],
  );

  const performDeletePlan = useCallback(async () => {
    if (!selectedPlanId) {
      setToast({ isOpen: true, message: 'Selecciona un plan antes de intentar eliminarlo.', type: 'error' });
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
        setToast({ isOpen: true, message: errorData.error || 'Error al eliminar el plan', type: 'error' });
        return;
      }

      const data = await response.json();
      setToast({ isOpen: true, message: data.message || 'Plan eliminado exitosamente', type: 'success' });

      const fallbackPlanId = availablePlans.find((p) => p.id !== selectedPlanId)?.id || null;
      await loadPlans(fallbackPlanId);

      if (!fallbackPlanId) {
        router.push('/study-planner/create');
      }
    } catch (error) {
      console.error('Error eliminando plan:', error);
      setToast({ isOpen: true, message: 'Error al eliminar el plan', type: 'error' });
    } finally {
      setIsDeletingPlan(false);
    }
  }, [selectedPlanId, availablePlans, loadPlans, router, setIsDeletingPlan, setToast]);

  const handleDeletePlan = useCallback(() => {
    const selectedPlan = availablePlans.find((p) => p.id === selectedPlanId);
    setConfirmDialog({
      isOpen: true,
      message: selectedPlan
        ? `Deseas eliminar el plan "${selectedPlan.name}"? Esta accion no se puede deshacer.`
        : 'Deseas eliminar este plan de estudio? Esta accion no se puede deshacer.',
      onConfirm: async () => {
        setConfirmDialog({ isOpen: false, message: '', onConfirm: () => {}, onCancel: () => {} });
        await performDeletePlan();
      },
      onCancel: () => {
        setConfirmDialog({ isOpen: false, message: '', onConfirm: () => {}, onCancel: () => {} });
      },
    });
  }, [availablePlans, selectedPlanId, performDeletePlan, setConfirmDialog]);

  return { loadPlans, handleDeletePlan };
}
