import type { TFunction } from 'i18next';
import { RefreshCw, Save, Settings } from 'lucide-react';

interface DashboardLayoutToolbarProps {
  isEditMode: boolean;
  isSaving: boolean;
  onCancelEdit: () => void;
  onEdit: () => void;
  onReset: () => void;
  onSave: () => void;
  t: TFunction<'admin'>;
  tc: TFunction<'common'>;
}

export function DashboardLayoutToolbar({
  isEditMode,
  isSaving,
  onCancelEdit,
  onEdit,
  onReset,
  onSave,
  t,
  tc
}: DashboardLayoutToolbarProps) {
  return (
    <div className="flex justify-end gap-2 mb-4">
      {!isEditMode ? (
        <button onClick={onEdit} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Settings className="w-4 h-4" />
          {t('dashboard.customizeLayout')}
        </button>
      ) : (
        <>
          <button onClick={onSave} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
            <Save className="w-4 h-4" />
            {isSaving ? tc('actions.saving') : tc('actions.save')}
          </button>
          <button onClick={onCancelEdit} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
            {tc('actions.cancel')}
          </button>
          <button onClick={onReset} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
            <RefreshCw className="w-4 h-4" />
            {t('dashboard.restoreLayout')}
          </button>
        </>
      )}
    </div>
  );
}
