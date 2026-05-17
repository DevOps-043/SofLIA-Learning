'use client';

import { useTranslation } from 'react-i18next';
import {
  ModuleModalError,
  ModuleModalFields,
  ModuleModalFooter,
  ModuleModalHeader,
  ModuleModalShell,
  type ModuleModalProps,
  useModuleModalState,
} from './module-modal';

export function ModuleModal(props: ModuleModalProps) {
  const { module, onClose } = props;
  const { t } = useTranslation('admin');
  const { t: tc } = useTranslation('common');
  const moduleState = useModuleModalState(props, t);

  return (
    <ModuleModalShell onClose={onClose}>
      <ModuleModalHeader isEditing={Boolean(module)} onClose={onClose} t={t} />
      <form onSubmit={moduleState.handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto space-y-4 p-4 sm:p-6">
          <ModuleModalError error={moduleState.error} />
          <ModuleModalFields formData={moduleState.formData} setFormData={moduleState.setFormData} t={t} />
        </div>
        <ModuleModalFooter loading={moduleState.loading} onClose={onClose} tc={tc} />
      </form>
    </ModuleModalShell>
  );
}
