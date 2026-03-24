'use client';

import { useEffect } from 'react';
import { useOrganizationStore, Organization } from '@/core/stores/organizationStore';
import { OrganizationStylesProvider } from '@/features/business-panel/contexts/OrganizationStylesContext';

interface OrganizationLayoutClientProps {
  children: React.ReactNode;
  organization: Organization;
}

/**
 * Client-side wrapper that syncs the organization from server-side validation
 * into the client-side Zustand store.
 *
 * This ensures that the organization context is immediately available
 * without waiting for a separate API call.
 */
export function OrganizationLayoutClient({
  children,
  organization,
}: OrganizationLayoutClientProps) {
  const setCurrentOrganization = useOrganizationStore(
    (state) => state.setCurrentOrganization
  );
  const setUserOrganizations = useOrganizationStore(
    (state) => state.setUserOrganizations
  );
  const userOrganizations = useOrganizationStore(
    (state) => state.userOrganizations
  );

  // Sync the validated organization to the store
  useEffect(() => {
    // Set as current organization
    setCurrentOrganization(organization);

    // If not already in user organizations list, add it
    const exists = userOrganizations.some((org) => org.id === organization.id);
    if (!exists) {
      setUserOrganizations([...userOrganizations, organization]);
    }

    // Save to localStorage for persistence across page loads
    if (typeof window !== 'undefined') {
      localStorage.setItem('last_organization_slug', organization.slug);
    }
  }, [
    organization,
    setCurrentOrganization,
    setUserOrganizations,
    userOrganizations,
  ]);

  return (
    <OrganizationStylesProvider orgSlug={organization.slug}>
      {children}
    </OrganizationStylesProvider>
  );
}
