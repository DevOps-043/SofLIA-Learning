import { FunnelIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface AccessRequestsFiltersProps {
  searchPlaceholder: string;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  setStatusFilter: (value: string) => void;
  statusFilter: string;
}

export function AccessRequestsFilters({
  searchPlaceholder,
  searchTerm,
  setSearchTerm,
  setStatusFilter,
  statusFilter,
}: AccessRequestsFiltersProps) {
  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-700 mb-8">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="relative">
          <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="pl-10 pr-8 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="approved">Aprobadas</option>
            <option value="rejected">Rechazadas</option>
          </select>
        </div>
      </div>
    </div>
  );
}
