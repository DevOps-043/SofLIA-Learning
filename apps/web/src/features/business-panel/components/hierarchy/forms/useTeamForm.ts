import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  buildTeamPayload,
  createEmptyTeamFormData,
  mapTeamToFormData,
  type TeamFormData,
} from './team-form.model';
import type { FieldUpdater } from './form-field.types';
import type { TeamFormProps } from './team-form.types';
import { useHierarchyGeocoding } from './useHierarchyGeocoding';

export function useTeamForm({ isOpen, onClose, onSave, selectedZoneId, team, zones }: TeamFormProps) {
  const params = useParams();
  const orgSlug = params?.orgSlug as string;
  const fallbackZoneId = selectedZoneId || zones[0]?.id || '';
  const [formData, setFormData] = useState<TeamFormData>(() => createEmptyTeamFormData(fallbackZoneId));
  const [error, setError] = useState<string | null>(null);
  const { handleAutoLocate, isGeocoding } = useHierarchyGeocoding(formData, setFormData, setError, orgSlug);

  useEffect(() => {
    setFormData(mapTeamToFormData(team, fallbackZoneId));
    setError(null);
  }, [team, isOpen, fallbackZoneId]);

  const zoneOptions = useMemo(() => [
    { label: 'Seleccionar zona...', value: '' },
    ...zones.map((zone) => ({
      label: `${zone.name}${zone.region?.name ? ` (${zone.region.name})` : ''}`,
      value: zone.id,
    })),
  ], [zones]);

  const updateField: FieldUpdater<TeamFormData> = (field, value) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!formData.zone_id) {
      setError('Selecciona una zona');
      return;
    }
    if (!formData.name.trim()) {
      setError('El nombre es requerido');
      return;
    }

    try {
      await onSave(buildTeamPayload(formData));
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Error al guardar');
    }
  };

  return { error, formData, handleAutoLocate, handleSubmit, isGeocoding, updateField, zoneOptions };
}
