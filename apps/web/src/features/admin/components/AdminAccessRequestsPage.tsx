'use client';

import { useTranslation } from 'react-i18next';
import { AccessRequestsErrorState, AccessRequestsLoadingState } from './admin-access-requests/AccessRequestsStates';
import { AccessRequestsFilters } from './admin-access-requests/AccessRequestsFilters';
import { AccessRequestsHeader } from './admin-access-requests/AccessRequestsHeader';
import { AccessRequestsStats } from './admin-access-requests/AccessRequestsStats';
import { AccessRequestsTable } from './admin-access-requests/AccessRequestsTable';
import { useAdminAccessRequests } from './admin-access-requests/useAdminAccessRequests';

export function AdminAccessRequestsPage() {
  const { t } = useTranslation('admin');
  const accessRequests = useAdminAccessRequests();

  if (accessRequests.isLoading) {
    return <AccessRequestsLoadingState label="Cargando solicitudes..." />;
  }

  if (accessRequests.error) {
    return (
      <AccessRequestsErrorState
        error={accessRequests.error}
        onRetry={accessRequests.fetchRequests}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-800">
      <AccessRequestsHeader onRefresh={accessRequests.fetchRequests} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AccessRequestsStats stats={accessRequests.stats} />
        <AccessRequestsFilters
          searchPlaceholder={t('searchPlaceholders.accessRequests')}
          searchTerm={accessRequests.searchTerm}
          setSearchTerm={accessRequests.setSearchTerm}
          setStatusFilter={accessRequests.setStatusFilter}
          statusFilter={accessRequests.statusFilter}
        />
        <AccessRequestsTable
          requests={accessRequests.filteredRequests}
          processingId={accessRequests.processingId}
          onProcess={accessRequests.processRequest}
        />
      </div>
    </div>
  );
}
