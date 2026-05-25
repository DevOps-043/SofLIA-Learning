import type { Region } from '../../../types/hierarchy.types';

interface RegionFormActionsProps {
  region?: Region | null;
  isLoading?: boolean;
  onClose: () => void;
}

export function RegionFormActions({
  region,
  isLoading,
  onClose
}: RegionFormActionsProps) {
  return (
    <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
      <button
        type="button"
        onClick={onClose}
        disabled={isLoading}
        className="px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg text-sm font-medium"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
      >
        {isLoading ? 'Guardando...' : region ? 'Guardar cambios' : 'Crear region'}
      </button>
    </div>
  );
}
