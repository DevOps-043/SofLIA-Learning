import {
  ArrowPathIcon,
  CheckCircleIcon,
  TrashIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface AdminPendingCourseActionBarProps {
  isRejected: boolean;
  onApprove: () => void;
  onDelete: () => void;
  onReject: () => void;
  onReconsider: () => void;
}

export function AdminPendingCourseActionBar({
  isRejected,
  onApprove,
  onDelete,
  onReject,
  onReconsider,
}: AdminPendingCourseActionBarProps) {
  return (
    <div className="flex gap-4 justify-end sticky bottom-6 bg-white/80 dark:bg-[#0A0D12]/90 backdrop-blur-md p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-20">
      {isRejected ? (
        <>
          <button
            onClick={onDelete}
            className="px-6 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <TrashIcon className="h-5 w-5" />
            Eliminar
          </button>
          <button
            onClick={onReconsider}
            className="px-6 py-2.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <ArrowPathIcon className="h-5 w-5" />
            Reconsiderar
          </button>
        </>
      ) : (
        <button
          onClick={onReject}
          className="px-6 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <XCircleIcon className="h-5 w-5" />
          Rechazar Curso
        </button>
      )}

      <button
        onClick={onApprove}
        className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-lg shadow-green-600/20 transition-all hover:scale-105 flex items-center gap-2"
      >
        <CheckCircleIcon className="h-5 w-5" />
        {isRejected ? 'Aprobar' : 'Aprobar y Publicar'}
      </button>
    </div>
  );
}
