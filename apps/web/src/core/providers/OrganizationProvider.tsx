'use client';

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
      role: org.role,
      subscriptionPlan: org.subscription_plan,
      subscriptionStatus: org.subscription_status,
    }));
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('OrganizationProvider fetcher error:', error);
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

export function OrganizationProvider({ children }: OrganizationProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Zustand store
  const {
    currentOrganization,
    userOrganizations,
    setCurrentOrganization,
    setUserOrganizations,
    switchOrganization: storeSwitch,
    clearOrganization,
    isHydrated,
  } = useOrganizationStore();

  // Track client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch organizations via SWR (only when mounted on client)
  const {
    data: fetchedOrganizations,
    isLoading,
    mutate,
  } = useSWR<Organization[] | null>(
    mounted ? '/api/users/organizations' : null,
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
        // Navigate to the new organization's dashboard
        router.push(`/${org.slug}/dashboard`);
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
      isLoading: !mounted || isLoading,
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
