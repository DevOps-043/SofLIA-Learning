'use client';

import { ContactSection } from './forms/ContactSection';
import { ErrorAlert, FormActions } from './forms/FormChrome';
import { LocationSection } from './forms/LocationSection';
import { ManagerSection } from './forms/ManagerSection';
import { Modal } from './forms/Modal';
import { useZoneForm } from './forms/useZoneForm';
import { ZoneBasicSection } from './forms/ZoneBasicSection';
import type { ZoneFormProps } from './forms/zone-form.types';

export function ZoneForm(props: ZoneFormProps) {
  const { availableManagers = [], isLoading, isOpen, onClose, zone } = props;
  const { error, formData, handleAutoLocate, handleSubmit, isGeocoding, regionOptions, updateField } = useZoneForm(props);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={zone ? 'Editar Zona' : 'Nueva Zona'} isLoading={isLoading} size="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorAlert message={error} />
        <ZoneBasicSection
          formData={formData}
          updateField={updateField}
          disabled={isLoading}
          isEditing={Boolean(zone)}
          regionOptions={regionOptions}
        />
        <LocationSection
          formData={formData}
          updateField={updateField}
          disabled={isLoading}
          isGeocoding={isGeocoding}
          onAutoLocate={handleAutoLocate}
        />
        <ContactSection formData={formData} updateField={updateField} disabled={isLoading} />
        <ManagerSection
          field="manager_id"
          formData={formData}
          updateField={updateField}
          disabled={isLoading}
          managers={availableManagers}
          title="Gerente de Zona"
          label="Asignar Gerente de Zona"
          emptyMessage="No hay usuarios disponibles para asignar."
        />
        <FormActions
          onCancel={onClose}
          isLoading={isLoading}
          isEditing={Boolean(zone)}
          createLabel="Crear zona"
          editLabel="Guardar cambios"
          submitClassName="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
        />
      </form>
    </Modal>
  );
}
