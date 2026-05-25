interface AccessRequestsHeaderProps {
  onRefresh: () => void;
}

export function AccessRequestsHeader({ onRefresh }: AccessRequestsHeaderProps) {
  return (
    <div className="bg-gray-900 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Solicitudes de Acceso</h1>
            <p className="text-gray-400">Gestiona las solicitudes de acceso a comunidades privadas</p>
          </div>
          <button
            onClick={onRefresh}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Actualizar
          </button>
        </div>
      </div>
    </div>
  );
}
