interface LoadingStateProps {
  label: string;
}

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

export function AccessRequestsLoadingState({ label }: LoadingStateProps) {
  return (
    <div className="min-h-screen bg-gray-800 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4" />
        <p className="text-gray-400">{label}</p>
      </div>
    </div>
  );
}

export function AccessRequestsErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="min-h-screen bg-gray-800 flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-400 mb-4">Error: {error}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
