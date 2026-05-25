interface RegionFormErrorProps {
  error: string | null;
}

export function RegionFormError({ error }: RegionFormErrorProps) {
  if (!error) {
    return null;
  }

  return (
    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
    </div>
  );
}
