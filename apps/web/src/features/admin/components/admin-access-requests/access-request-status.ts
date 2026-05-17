import type { AccessRequest } from './types';

export function getStatusColor(status: AccessRequest['status'] | string): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'approved':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }
}

export function getStatusLabel(status: AccessRequest['status'] | string): string {
  switch (status) {
    case 'pending':
      return 'Pendiente';
    case 'approved':
      return 'Aprobada';
    case 'rejected':
      return 'Rechazada';
    default:
      return status;
  }
}

export function filterAccessRequests(
  requests: AccessRequest[],
  searchTerm: string,
  statusFilter: string
): AccessRequest[] {
  const normalizedSearch = searchTerm.toLowerCase();

  return requests.filter((request) => {
    const matchesSearch =
      request.requester.username.toLowerCase().includes(normalizedSearch) ||
      request.requester.email.toLowerCase().includes(normalizedSearch) ||
      request.community.name.toLowerCase().includes(normalizedSearch);
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;

    return matchesSearch && matchesStatus;
  });
}
