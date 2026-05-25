'use client';

import { ContactSection } from './forms/ContactSection';
import { ErrorAlert, FormActions } from './forms/FormChrome';
import { LocationSection } from './forms/LocationSection';
import { Modal } from './forms/Modal';
import { TeamBasicSection } from './forms/TeamBasicSection';
import { TeamGoalsSection } from './forms/TeamGoalsSection';
import type { TeamFormProps } from './forms/team-form.types';
import { useTeamForm } from './forms/useTeamForm';

export function TeamForm(props: TeamFormProps) {
  const { availableLeaders = [], isLoading, isOpen, onClose, team } = props;
  const { error, formData, handleAutoLocate, handleSubmit, isGeocoding, updateField, zoneOptions } = useTeamForm(props);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={team ? 'Editar Equipo' : 'Nuevo Equipo'} isLoading={isLoading} size="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorAlert message={error} />
        <TeamBasicSection
          formData={formData}
          updateField={updateField}
          disabled={isLoading}
          isEditing={Boolean(team)}
          leaders={availableLeaders}
          zoneOptions={zoneOptions}
        />
        <TeamGoalsSection formData={formData} updateField={updateField} disabled={isLoading} />
        <LocationSection
          formData={formData}
          updateField={updateField}
          disabled={isLoading}
          isGeocoding={isGeocoding}
          onAutoLocate={handleAutoLocate}
        />
        <ContactSection formData={formData} updateField={updateField} disabled={isLoading} />
        <FormActions
          onCancel={onClose}
          isLoading={isLoading}
          isEditing={Boolean(team)}
          createLabel="Crear equipo"
          editLabel="Guardar cambios"
          submitClassName="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
        />
      </form>
    </Modal>
  );
}
