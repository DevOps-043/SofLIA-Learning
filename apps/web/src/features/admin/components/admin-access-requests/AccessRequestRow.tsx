import { motion } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { getStatusColor, getStatusLabel } from './access-request-status';
import type { AccessRequest } from './types';

interface AccessRequestRowProps {
  onProcess: (requestId: string, communityId: string, action: 'approve' | 'reject') => void;
  processingId: string | null;
  request: AccessRequest;
}

export function AccessRequestRow({ onProcess, processingId, request }: AccessRequestRowProps) {
  const isProcessing = processingId === request.id;

  return (
    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="hover:bg-gray-800/50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
            {request.requester.first_name?.charAt(0) || request.requester.username.charAt(0).toUpperCase()}
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-white">{getRequesterName(request)}</div>
            <div className="text-sm text-gray-400">{request.requester.email}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-white">{request.community.name}</div>
        <div className="text-sm text-gray-400">/{request.community.slug}</div>
      </td>
      <td className="px-6 py-4"><div className="text-sm text-gray-300 max-w-xs truncate">{request.note || 'Sin nota'}</div></td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}>{getStatusLabel(request.status)}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{new Date(request.created_at).toLocaleDateString('es-ES')}</td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        {request.status === 'pending' ? (
          <div className="flex items-center justify-end space-x-2">
            <ActionButton action="approve" icon={CheckCircleIcon} isProcessing={isProcessing} label="Aprobar" onClick={() => onProcess(request.id, request.community_id, 'approve')} />
            <ActionButton action="reject" icon={XCircleIcon} isProcessing={isProcessing} label="Rechazar" onClick={() => onProcess(request.id, request.community_id, 'reject')} />
          </div>
        ) : (
          <span className="text-gray-500">{request.reviewed_at ? `Revisado ${new Date(request.reviewed_at).toLocaleDateString('es-ES')}` : 'Procesado'}</span>
        )}
      </td>
    </motion.tr>
  );
}

function ActionButton({ action, icon: Icon, isProcessing, label, onClick }: { action: 'approve' | 'reject'; icon: typeof CheckCircleIcon; isProcessing: boolean; label: string; onClick: () => void }) {
  const colorClassName = action === 'approve' ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
  return (
    <button onClick={onClick} disabled={isProcessing} className={`inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${colorClassName}`}>
      {isProcessing ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Icon className="h-4 w-4 mr-1" />{label}</>}
    </button>
  );
}

function getRequesterName(request: AccessRequest): string {
  return request.requester.first_name && request.requester.last_name
    ? `${request.requester.first_name} ${request.requester.last_name}`
    : request.requester.username;
}
