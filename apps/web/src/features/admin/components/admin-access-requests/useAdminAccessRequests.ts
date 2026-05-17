import { useEffect, useMemo, useState } from 'react';
import { emptyAccessRequestStats, type AccessRequest, type AccessRequestStats } from './types';
import { filterAccessRequests } from './access-request-status';

export function useAdminAccessRequests() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [stats, setStats] = useState<AccessRequestStats>(emptyAccessRequestStats);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/communities/access-requests');
      if (!response.ok) throw new Error('Error al cargar solicitudes');

      const data = await response.json();
      setRequests(data.requests || []);
      setStats(data.stats || emptyAccessRequestStats);
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const processRequest = async (requestId: string, communityId: string, action: 'approve' | 'reject') => {
    try {
      setProcessingId(requestId);
      const response = await fetch(
        `/api/admin/communities/${communityId}/access-requests/${requestId}/${action}`,
        { method: 'POST' }
      );
      if (!response.ok) throw new Error(action === 'approve' ? 'Error al aprobar solicitud' : 'Error al rechazar solicitud');
      await fetchRequests();
    } catch (processError) {
      setError(processError instanceof Error ? processError.message : 'Error al procesar solicitud');
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    void fetchRequests();
  }, []);

  const filteredRequests = useMemo(
    () => filterAccessRequests(requests, searchTerm, statusFilter),
    [requests, searchTerm, statusFilter]
  );

  return {
    error,
    fetchRequests,
    filteredRequests,
    isLoading,
    processingId,
    processRequest,
    searchTerm,
    setSearchTerm,
    setStatusFilter,
    stats,
    statusFilter,
  };
}
