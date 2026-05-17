import { AnimatePresence } from 'framer-motion';
import { AccessRequestRow } from './AccessRequestRow';
import type { AccessRequest } from './types';

interface AccessRequestsTableProps {
  onProcess: (requestId: string, communityId: string, action: 'approve' | 'reject') => void;
  processingId: string | null;
  requests: AccessRequest[];
}

const columns = ['Usuario', 'Comunidad', 'Nota', 'Estado', 'Fecha', 'Acciones'];

export function AccessRequestsTable({ onProcess, processingId, requests }: AccessRequestsTableProps) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800 border-b border-gray-700">
            <tr>
              {columns.map((column) => (
                <th key={column} className={`px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider ${column === 'Acciones' ? 'text-right' : 'text-left'}`}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            <AnimatePresence>
              {requests.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No se encontraron solicitudes</td></tr>
              ) : (
                requests.map((request) => (
                  <AccessRequestRow key={request.id} request={request} processingId={processingId} onProcess={onProcess} />
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
