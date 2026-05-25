import { useEffect, useState, type FormEvent } from 'react';
import type { TFunction } from 'i18next';
import type { ModuleFormData, ModuleModalProps } from './types';

const emptyModuleFormData: ModuleFormData = {
  is_published: false,
  is_required: true,
  module_description: '',
  module_title: '',
};

function createModuleFormData(module: ModuleModalProps['module']): ModuleFormData {
  if (!module) return emptyModuleFormData;

  return {
    is_published: module.is_published,
    is_required: module.is_required,
    module_description: module.module_description || '',
    module_title: module.module_title,
  };
}

export function useModuleModalState({ module, onClose, onSave }: ModuleModalProps, t: TFunction<'admin'>) {
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ModuleFormData>(() => createModuleFormData(module));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData(createModuleFormData(module));
    setError(null);
  }, [module]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSave(formData);
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t('workshops.errors.saveModule'));
    } finally {
      setLoading(false);
    }
  };

  return { error, formData, handleSubmit, loading, setFormData };
}
