'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Organization interface representing a user's organization membership
 */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  brandLogoUrl?: string | null;
  brandColorPrimary?: string | null;
  brandColorSecondary?: string | null;
  brandColorAccent?: string | null;
  brandFontFamily?: string | null;
  role: 'owner' | 'admin' | 'member';
  subscriptionPlan?: 'team' | 'business' | 'enterprise';
  subscriptionStatus?: 'active' | 'expired' | 'cancelled' | 'trial' | 'pending';
  isPlatformAdmin?: boolean;
}

interface OrganizationState {
  // Current active organization context
  currentOrganization: Organization | null;

  // All organizations the user belongs to
  userOrganizations: Organization[];

  // Loading state
  isLoading: boolean;

  // Whether the store has been hydrated from storage
  isHydrated: boolean;

  // Actions
  setCurrentOrganization: (org: Organization | null) => void;
  setUserOrganizations: (orgs: Organization[]) => void;
  setLoading: (loading: boolean) => void;
  setHydrated: (hydrated: boolean) => void;

  // Switch to a different organization by ID or slug
  switchOrganization: (orgIdOrSlug: string) => Organization | null;

  // Clear all organization state (on logout)
  clearOrganization: () => void;

  // Get organization by slug
  getOrganizationBySlug: (slug: string) => Organization | null;

  // Get organization by ID
  getOrganizationById: (id: string) => Organization | null;

  // Check if user has multiple organizations
  hasMultipleOrganizations: () => boolean;

  // Check if user is admin/owner of current organization
  isOrgAdmin: () => boolean;
}

export const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set, get) => ({
      currentOrganization: null,
      userOrganizations: [],
      isLoading: false,
      isHydrated: false,

      setCurrentOrganization: (org) => {
        set({ currentOrganization: org });
      },

      setUserOrganizations: (orgs) => {
        set({ userOrganizations: orgs });

        // If there's no current organization set, auto-select the first one
        const { currentOrganization } = get();
        if (!currentOrganization && orgs.length > 0) {
          set({ currentOrganization: orgs[0] });
        }

        // If current organization is no longer in the list, clear it
        if (
          currentOrganization &&
          !orgs.find((o) => o.id === currentOrganization.id)
        ) {
          set({ currentOrganization: orgs[0] || null });
        }
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      setHydrated: (hydrated) => {
        set({ isHydrated: hydrated });
      },

      switchOrganization: (orgIdOrSlug) => {
        const { userOrganizations } = get();
        const org = userOrganizations.find(
          (o) => o.id === orgIdOrSlug || o.slug === orgIdOrSlug
        );

        if (org) {
          set({ currentOrganization: org });
          return org;
        }

        return null;
      },

      clearOrganization: () => {
        set({
          currentOrganization: null,
          userOrganizations: [],
          isLoading: false,
        });

        // Also clear from localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('organization-storage');
        }
      },

      getOrganizationBySlug: (slug) => {
        const { userOrganizations } = get();
        return userOrganizations.find((o) => o.slug === slug) || null;
      },

      getOrganizationById: (id) => {
        const { userOrganizations } = get();
        return userOrganizations.find((o) => o.id === id) || null;
      },

      hasMultipleOrganizations: () => {
        const { userOrganizations } = get();
        return userOrganizations.length > 1;
      },

      isOrgAdmin: () => {
        const { currentOrganization } = get();
        if (!currentOrganization) return false;
        return ['owner', 'admin'].includes(currentOrganization.role);
      },
    }),
    {
      name: 'organization-storage',
      // Only persist the current organization ID and slug (not full data)
      // This ensures we don't have stale organization data
      partialize: (state) => ({
        currentOrganization: state.currentOrganization
          ? {
              id: state.currentOrganization.id,
              slug: state.currentOrganization.slug,
            }
          : null,
      }),
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            state.setHydrated(true);
          }
        };
      },
    }
  )
);

/**
 * Hook to get current organization ID
 * Returns null for B2C users (no organization context)
 */
export function useCurrentOrganizationId(): string | null {
  const currentOrganization = useOrganizationStore(
    (state) => state.currentOrganization
  );
  return currentOrganization?.id ?? null;
}

/**
 * Hook to get current organization slug
 * Returns null for B2C users
 */
export function useCurrentOrganizationSlug(): string | null {
  const currentOrganization = useOrganizationStore(
    (state) => state.currentOrganization
  );
  return currentOrganization?.slug ?? null;
}

/**
 * Hook to check if user is in B2B context (has active organization)
 */
export function useIsB2B(): boolean {
  const currentOrganization = useOrganizationStore(
    (state) => state.currentOrganization
  );
  return currentOrganization !== null;
}

/**
 * Hook to check if user can switch organizations
 */
export function useCanSwitchOrganizations(): boolean {
  const organizations = useOrganizationStore((state) => state.userOrganizations);
  return organizations.length > 1;
}
