interface ErrorAlertProps {
  message: string | null;
}

interface FormActionsProps {
  createLabel: string;
  editLabel: string;
  isEditing: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
  onCancel: () => void;
  submitClassName: string;
}

export function ErrorAlert({ message }: ErrorAlertProps) {
  if (!message) return null;

  return (
    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
    </div>
  );
}

export function FormActions({
  createLabel,
  editLabel,
  isEditing,
  isLoading,
  loadingLabel = 'Guardando...',
  onCancel,
  submitClassName,
}: FormActionsProps) {
  return (
    <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
      <button
        type="button"
        onClick={onCancel}
        disabled={isLoading}
        className="px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg text-sm font-medium"
      >
        Cancelar
      </button>
      <button type="submit" disabled={isLoading} className={submitClassName}>
        {isLoading ? loadingLabel : isEditing ? editLabel : createLabel}
      </button>
    </div>
  );
}
