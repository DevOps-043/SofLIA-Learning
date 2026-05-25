'use client';

import { Modal } from './HierarchyForms';
import { RegionBasicSection } from './RegionForm/RegionBasicSection';
import { RegionContactSection } from './RegionForm/RegionContactSection';
import { RegionFormActions } from './RegionForm/RegionFormActions';
import { RegionFormError } from './RegionForm/RegionFormError';
import { RegionLocationSection } from './RegionForm/RegionLocationSection';
import { RegionManagerSection } from './RegionForm/RegionManagerSection';
import type { RegionFormProps } from './RegionForm/types';
import { useRegionForm } from './RegionForm/useRegionForm';

export function RegionForm({
  region,
  isOpen,
  onClose,
  onSave,
  isLoading,
  availableManagers = []
}: RegionFormProps) {
  const {
    error,
    formData,
    isGeocoding,
    handleAutoLocate,
    handleSubmit,
    updateField
  } = useRegionForm({ region, isOpen, onClose, onSave });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={region ? 'Editar Region' : 'Nueva Region'}
      isLoading={isLoading}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <RegionFormError error={error} />
        <RegionBasicSection
          formData={formData}
          isLoading={isLoading}
          onFieldChange={updateField}
        />
        <RegionLocationSection
          formData={formData}
          isGeocoding={isGeocoding}
          isLoading={isLoading}
          onAutoLocate={handleAutoLocate}
          onFieldChange={updateField}
        />
        <RegionContactSection
          formData={formData}
          isLoading={isLoading}
          onFieldChange={updateField}
        />
        <RegionManagerSection
          availableManagers={availableManagers}
          formData={formData}
          isLoading={isLoading}
          onFieldChange={updateField}
        />
        <RegionFormActions region={region} isLoading={isLoading} onClose={onClose} />
      </form>
    </Modal>
  );
}
