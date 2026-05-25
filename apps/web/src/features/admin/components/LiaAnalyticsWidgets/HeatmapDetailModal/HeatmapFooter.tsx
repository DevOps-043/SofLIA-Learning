interface HeatmapFooterProps {
  onClose: () => void;
  period: string;
}

export function HeatmapFooter({ onClose, period }: HeatmapFooterProps) {
  return (
    <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-900/50">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Datos del periodo: {period === 'month' ? 'Ultimo mes' : period}
        </p>
        <button
          className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          onClick={onClose}
          type="button"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
