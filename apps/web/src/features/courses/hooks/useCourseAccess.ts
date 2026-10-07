'use client';

import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useOrganizationStore } from '@/core/stores/organizationStore';

interface CourseAccessState {
    hasAccess: boolean | null; // null = loading
    isLoading: boolean;
    error: string | null;
}

/**
 * Hook para verificar si el usuario tiene acceso a un curso
 * Verifica la inscripción o asignación del usuario en la organización consultada.
 */
export function useCourseAccess(
    courseSlug: string,
    organizationId?: string | null,
    enabled = true,
): CourseAccessState {
    const { user, loading: authLoading } = useAuth();
    const userId = user?.id ?? null;
    const currentOrganization = useOrganizationStore(state => state.currentOrganization);
    const scopedOrganizationId = organizationId === undefined
        ? currentOrganization?.id ?? null
        : organizationId;
    const requestKey = JSON.stringify([userId, courseSlug, scopedOrganizationId]);
    const [state, setState] = useState<CourseAccessState & { requestKey: string | null }>({
        requestKey: null,
        hasAccess: null,
        isLoading: true,
        error: null,
    });

    useEffect(() => {
        const controller = new AbortController();
        let active = true;
        const applyState = (nextState: CourseAccessState) => {
            if (active) setState({ ...nextState, requestKey });
        };

        async function checkAccess() {
            if (!enabled || !courseSlug) {
                applyState({
                    hasAccess: null,
                    isLoading: true,
                    error: null,
                });
                return;
            }

            // Esperar a que termine la autenticación
            if (authLoading) {
                applyState({ hasAccess: null, isLoading: true, error: null });
                return;
            }

            // Si no hay usuario, no tiene acceso
            if (!userId) {
                applyState({
                    hasAccess: false,
                    isLoading: false,
                    error: 'Debes iniciar sesión para acceder a este curso',
                });
                return;
            }

            try {
                applyState({ hasAccess: null, isLoading: true, error: null });
                // Construir URL con el ID de la organización activa si existe
                let url = `/api/courses/${courseSlug}/check-purchase`;
                if (scopedOrganizationId) {
                    url += `?orgId=${scopedOrganizationId}`;
                }

                // Verificar si el usuario ha comprado el curso o lo tiene asignado
                const response = await fetch(url, {
                    credentials: 'include',
                    cache: 'no-store',
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error('Error al verificar acceso al curso');
                }

                const data = await response.json();

                applyState({
                    hasAccess: data.isPurchased,
                    isLoading: false,
                    error: data.isPurchased
                        ? null
                        : 'No tienes acceso a este curso en esta organización. Solicita la asignación al administrador.',
                });
            } catch (error) {
                if (!active || controller.signal.aborted) return;
                techDebtLogger.error('[useCourseAccess] Error:', error);
                applyState({
                    hasAccess: false,
                    isLoading: false,
                    error: 'Error al verificar acceso al curso',
                });
            }
        }

        void checkAccess();
        return () => {
            active = false;
            controller.abort();
        };
    }, [courseSlug, userId, authLoading, scopedOrganizationId, enabled, requestKey]);

    if (!enabled || authLoading || state.requestKey !== requestKey) {
        return { hasAccess: null, isLoading: true, error: null };
    }

    return { hasAccess: state.hasAccess, isLoading: state.isLoading, error: state.error };
}
