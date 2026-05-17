import type { TFunction } from 'i18next';

interface DashboardResetConfirmProps {
  onCancel: () => void;
  onConfirm: () => void;
  t: TFunction<'admin'>;
  tc: TFunction<'common'>;
}

export function DashboardResetConfirm({
  onCancel,
  onConfirm,
  t,
  tc
}: DashboardResetConfirmProps) {
  return (
    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-between gap-3">
      <p className="text-sm text-red-700 dark:text-red-400">{t('dashboard.confirmResetLayout')}</p>
      <div className="flex gap-2 flex-shrink-0">
        <button onClick={onCancel} className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded hover:bg-red-50 transition-colors">
          {tc('actions.cancel')}
        </button>
        <button onClick={onConfirm} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
          {tc('actions.confirm')}
        </button>
      </div>
    </div>
  );
}
