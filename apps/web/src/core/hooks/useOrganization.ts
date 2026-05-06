'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

import {
  useOrganizationStore,
  Organization,
  useCurrentOrganizationId,
  useCurrentOrganizationSlug,
  useIsB2B,
  useCanSwitchOrganizations,
} from '../stores/organizationStore';
import { getOrganizationDashboardPath } from '../utils/organizationNavigation';

/**
 * Main hook for accessing organization context throughout the application.
 *
 * This hook provides:
 * - Current organization state
 * - Organization switching capabilities
 * - B2B vs B2C context detection
 * - Admin role checking
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const {
 *     currentOrganization,
 *     organizations,
 *     isB2B,
 *     switchOrganization,
 *   } = useOrganization();
 *
 *   if (!isB2B) {
 *     return <div>Personal account</div>;
 *   }
 *
 *   return (
 *     <div>
 *       <h1>{currentOrganization.name}</h1>
 *       <select onChange={(e) => switchOrganization(e.target.value)}>
 *         {organizations.map(org => (
 *           <option key={org.id} value={org.slug}>{org.name}</option>
 *         ))}
 *       </select>
 *     </div>
 *   );
 * }
 * ```
 */
export function useOrganization() {
  const router = useRouter();

  // Get state from store
  const currentOrganization = useOrganizationStore(
    (state) => state.currentOrganization
  );
  const userOrganizations = useOrganizationStore(
    (state) => state.userOrganizations
  );
  const isLoading = useOrganizationStore((state) => state.isLoading);
  const isHydrated = useOrganizationStore((state) => state.isHydrated);

  // Get actions from store
  const storeSwitch = useOrganizationStore((state) => state.switchOrganization);
  const setCurrentOrganization = useOrganizationStore(
    (state) => state.setCurrentOrganization
  );
  const clearOrganization = useOrganizationStore(
    (state) => state.clearOrganization
  );
  const getOrganizationBySlug = useOrganizationStore(
    (state) => state.getOrganizationBySlug
  );
  const getOrganizationById = useOrganizationStore(
    (state) => state.getOrganizationById
  );

  /**
   * Switch to a different organization by ID or slug.
   * Automatically navigates to the new organization's dashboard.
   */
  const switchOrganization = useCallback(
    (orgIdOrSlug: string, navigate: boolean = true) => {
      const org = storeSwitch(orgIdOrSlug);
      if (org && navigate) {
        router.push(getOrganizationDashboardPath(org));
      }
      return org;
    },
    [storeSwitch, router]
  );

  /**
   * Switch organization without navigation.
   * Useful when you want to change context but stay on current page.
   */
  const switchOrganizationSilent = useCallback(
    (orgIdOrSlug: string) => {
      return storeSwitch(orgIdOrSlug);
    },
    [storeSwitch]
  );

  /**
   * Navigate to a path within the current organization context.
   * Automatically prefixes with organization slug if in B2B context.
   *
   * @example
   * navigateToOrgPath('/courses') -> '/acme-corp/courses'
   */
  const navigateToOrgPath = useCallback(
    (path: string) => {
      if (currentOrganization) {
        // Ensure path starts with /
        const normalizedPath = path.startsWith('/') ? path : `/${path}`;
        router.push(`/${currentOrganization.slug}${normalizedPath}`);
      } else {
        // B2C user - navigate directly
        router.push(path);
      }
    },
    [currentOrganization, router]
  );

  /**
   * Build a URL path with organization context.
   *
   * @example
   * buildOrgPath('/courses') -> '/acme-corp/courses' (B2B)
   * buildOrgPath('/courses') -> '/courses' (B2C)
   */
  const buildOrgPath = useCallback(
    (path: string): string => {
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      if (currentOrganization) {
        return `/${currentOrganization.slug}${normalizedPath}`;
      }
      return normalizedPath;
    },
    [currentOrganization]
  );

  return {
    // State
    currentOrganization,
    currentOrganizationId: currentOrganization?.id ?? null,
    currentOrganizationSlug: currentOrganization?.slug ?? null,
    organizations: userOrganizations,
    isLoading,
    isHydrated,

    // Computed
    isB2B: currentOrganization !== null,
    isB2C: currentOrganization === null,
    canSwitch: userOrganizations.length > 1,
    isOrgAdmin:
      currentOrganization !== null &&
      ['owner', 'admin'].includes(currentOrganization.role),
    isOrgOwner: currentOrganization?.role === 'owner',
    isOrgMember: currentOrganization?.role === 'member',

    // Actions
    switchOrganization,
    switchOrganizationSilent,
    setCurrentOrganization,
    clearOrganization,
    getOrganizationBySlug,
    getOrganizationById,

    // Navigation helpers
    navigateToOrgPath,
    buildOrgPath,
  };
}

// Re-export individual hooks for granular access
export {
  useCurrentOrganizationId,
  useCurrentOrganizationSlug,
  useIsB2B,
  useCanSwitchOrganizations,
};

// Export types
export type { Organization } from '../stores/organizationStore';
