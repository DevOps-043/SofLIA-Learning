'use client';

import { logger as techDebtLogger } from '@/lib/utils/logger'
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import useSWR from 'swr';

import {
  useOrganizationStore,
  Organization,
} from '../stores/organizationStore';
import { getOrganizationDashboardPath } from '../utils/organizationNavigation';

// ============================================================================
// Types
// ============================================================================

interface OrganizationContextValue {
  /** Current active organization (null for B2C users) */
  currentOrganization: Organization | null;

  /** All organizations the user belongs to */
  organizations: Organization[];

  /** Whether user is in a B2B context (has organization) */
  isB2B: boolean;

  /** Whether user can switch between organizations */
  canSwitch: boolean;

  /** Whether organization data is loading */
  isLoading: boolean;

  /** Switch to a different organization */
  switchOrganization: (org: Organization) => void;

  /** Check if current user is org admin */
  isOrgAdmin: boolean;

  /** Refresh organizations from server */
  refreshOrganizations: () => Promise<void>;
}

// ============================================================================
// Context
// ============================================================================

const OrganizationContext = createContext<OrganizationContextValue | undefined>(
  undefined
);

// ============================================================================
// API Fetcher
// ============================================================================

interface OrganizationsResponse {
  success: boolean;
  organizations: Array<{
    id: string;
    name: string;
    slug: string;
    logo_url?: string | null;
    brand_logo_url?: string | null;
    brand_color_primary?: string | null;
    brand_color_secondary?: string | null;
    brand_color_accent?: string | null;
    branding_enabled?: boolean | null;
    show_navbar_name?: boolean | null;
    role: 'owner' | 'admin' | 'member';
    subscription_plan?: 'team' | 'business' | 'enterprise';
    subscription_status?: 'active' | 'expired' | 'cancelled' | 'trial' | 'pending';
  }>;
}

const organizationsFetcher = async (
  url: string
): Promise<Organization[] | null> => {
  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return null;
      }
      throw new Error('Error fetching organizations');
    }

    const data: OrganizationsResponse = await response.json();

    if (!data.success || !data.organizations) {
      return [];
    }

    // Map API response to Organization interface
    return data.organizations.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      logoUrl: org.logo_url,
      brandLogoUrl: org.brand_logo_url,
      brandColorPrimary: org.brand_color_primary,
      brandColorSecondary: org.brand_color_secondary,
      brandColorAccent: org.brand_color_accent,
      brandingEnabled: org.branding_enabled ?? false,
      showNavbarName: org.show_navbar_name ?? true,
      role: org.role,
      subscriptionPlan: org.subscription_plan,
      subscriptionStatus: org.subscription_status,
    }));
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      techDebtLogger.warn('OrganizationProvider fetcher error:', error);
    }
    return null;
  }
};

// ============================================================================
// Provider Component
// ============================================================================

interface OrganizationProviderProps {
  children: ReactNode;
}

type IdleWindow = Window & {
  requestIdleCallback?: (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
};

export function OrganizationProvider({ children }: OrganizationProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [shouldFetchOrganizations, setShouldFetchOrganizations] = useState(false);

  // Zustand store
  const {
    currentOrganization,
    userOrganizations,
    setCurrentOrganization,
    setUserOrganizations,
    setLoading: setStoreLoading,
    switchOrganization: storeSwitch,
    clearOrganization,
    isHydrated,
  } = useOrganizationStore();

  // Track client-side mounting
  useEffect(() => {
    setMounted(true);
    const idleWindow = window as IdleWindow;

    if (idleWindow.requestIdleCallback) {
      const idleHandle = idleWindow.requestIdleCallback(
        () => setShouldFetchOrganizations(true),
        { timeout: 1500 }
      );

      return () => idleWindow.cancelIdleCallback?.(idleHandle);
    }

    const timeoutId = window.setTimeout(
      () => setShouldFetchOrganizations(true),
      600
    );

    return () => window.clearTimeout(timeoutId);
  }, []);

  // Fetch the full organization list after idle. Org-scoped layouts already
  // hydrate the active organization, so this avoids blocking route paint.
  const {
    data: fetchedOrganizations,
    isLoading,
    mutate,
  } = useSWR<Organization[] | null>(
    mounted && shouldFetchOrganizations ? '/api/users/organizations' : null,
    organizationsFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10000,
      refreshInterval: 0,
      shouldRetryOnError: false,
      errorRetryCount: 0,
    }
  );

  // Sync SWR loading state into Zustand so consumers of useOrganization()
  // see accurate isLoading before the first fetch completes.
  useEffect(() => {
    const hasOrganizationSnapshot =
      currentOrganization !== null || userOrganizations.length > 0;
    setStoreLoading(
      !mounted ||
        (shouldFetchOrganizations && isLoading && !hasOrganizationSnapshot)
    );
  }, [
    mounted,
    isLoading,
    shouldFetchOrganizations,
    currentOrganization,
    userOrganizations.length,
    setStoreLoading,
  ]);

  // Sync fetched organizations to store
  // Also handles empty array (user has no active orgs) to avoid stale data
  useEffect(() => {
    if (fetchedOrganizations !== null && fetchedOrganizations !== undefined) {
      setUserOrganizations(fetchedOrganizations);
    }
  }, [fetchedOrganizations, setUserOrganizations]);

  // Clear organization state when no organizations found (logged out or B2C user)
  useEffect(() => {
    if (mounted && isHydrated && fetchedOrganizations === null) {
      clearOrganization();
    }
  }, [mounted, isHydrated, fetchedOrganizations, clearOrganization]);

  // Extract org slug from URL and sync with store
  useEffect(() => {
    if (!mounted || !isHydrated || !pathname) return;

    // Extract org slug from path: /[orgSlug]/... or nothing
    // Exclude known static routes
    const staticRoutes = [
      'api',
      'auth',
      '_next',
      'public',
      'courses',
      'profile',
      'settings',
      'communities',
      'news',
      'admin',
      'instructor',
      'business-panel', // Legacy route
      'business-user', // Legacy route
      'dashboard',
      'certificates',
      'study-planner',
      'account-settings',
    ];

    const pathParts = pathname.split('/').filter(Boolean);
    const potentialSlug = pathParts[0];

    // Check if first path segment could be an org slug
    if (potentialSlug && !staticRoutes.includes(potentialSlug)) {
      // Try to find organization by slug
      const org = userOrganizations.find((o) => o.slug === potentialSlug);
      if (org && (!currentOrganization || currentOrganization.id !== org.id)) {
        setCurrentOrganization(org);
      }
    }
  }, [
    mounted,
    pathname,
    userOrganizations,
    currentOrganization,
    setCurrentOrganization,
    isHydrated,
  ]);

  // Switch organization and navigate
  const switchOrganization = useCallback(
    (org: Organization) => {
      const switched = storeSwitch(org.id);
      if (switched) {
        router.push(getOrganizationDashboardPath(org));
      }
    },
    [storeSwitch, router]
  );

  // Refresh organizations from server
  const refreshOrganizations = useCallback(async () => {
    await mutate();
  }, [mutate]);

  // Memoized context value
  const contextValue = useMemo<OrganizationContextValue>(
    () => ({
      currentOrganization,
      organizations: userOrganizations,
      isB2B: currentOrganization !== null,
      canSwitch: userOrganizations.length > 1,
      isLoading:
        !mounted ||
        (shouldFetchOrganizations &&
          isLoading &&
          currentOrganization === null &&
          userOrganizations.length === 0),
      switchOrganization,
      isOrgAdmin:
        currentOrganization !== null &&
        ['owner', 'admin'].includes(currentOrganization.role),
      refreshOrganizations,
    }),
    [
      mounted,
      currentOrganization,
      userOrganizations,
      isLoading,
      shouldFetchOrganizations,
      switchOrganization,
      refreshOrganizations,
    ]
  );

  return (
    <OrganizationContext.Provider value={contextValue}>
      {children}
    </OrganizationContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access organization context.
 * Must be used within an OrganizationProvider.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { currentOrganization, isB2B, switchOrganization } = useOrganizationContext();
 *
 *   if (!isB2B) {
 *     return <div>B2C User - No organization context</div>;
 *   }
 *
 *   return <div>Current Org: {currentOrganization.name}</div>;
 * }
 * ```
 */
export function useOrganizationContext() {
  const context = useContext(OrganizationContext);

  if (!context) {
    throw new Error(
      'useOrganizationContext must be used within an OrganizationProvider'
    );
  }

  return context;
}

// ============================================================================
// Exports
// ============================================================================

export type { OrganizationContextValue };
