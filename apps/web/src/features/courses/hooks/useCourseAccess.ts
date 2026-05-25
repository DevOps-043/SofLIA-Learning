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
 * Verifica que el usuario esté autenticado y que haya comprado el curso
 */
export function useCourseAccess(courseSlug: string): CourseAccessState {
    const { user, loading: authLoading } = useAuth();
    const currentOrganization = useOrganizationStore(state => state.currentOrganization);
    const [state, setState] = useState<CourseAccessState>({
        hasAccess: null,
        isLoading: true,
        error: null,
    });

    useEffect(() => {
        async function checkAccess() {
            // Esperar a que termine la autenticación
            if (authLoading) {
                return;
            }

            // Si no hay usuario, no tiene acceso
            if (!user) {
                setState({
                    hasAccess: false,
                    isLoading: false,
                    error: 'Debes iniciar sesión para acceder a este curso',
                });
                return;
            }

            try {
                // Construir URL con el ID de la organización activa si existe
                let url = `/api/courses/${courseSlug}/check-purchase`;
                if (currentOrganization?.id) {
                    url += `?orgId=${currentOrganization.id}`;
                }

                // Verificar si el usuario ha comprado el curso o lo tiene asignado
                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error('Error al verificar acceso al curso');
                }

                const data = await response.json();

                setState({
                    hasAccess: data.isPurchased,
                    isLoading: false,
                    error: data.isPurchased
                        ? null
                        : 'No tienes acceso a este curso. Por favor, adquiérelo primero.',
                });
            } catch (error) {
                techDebtLogger.error('[useCourseAccess] Error:', error);
                setState({
                    hasAccess: false,
                    isLoading: false,
                    error: 'Error al verificar acceso al curso',
                });
            }
        }

        checkAccess();
    }, [courseSlug, user, authLoading, currentOrganization?.id]);

    return state;
}
