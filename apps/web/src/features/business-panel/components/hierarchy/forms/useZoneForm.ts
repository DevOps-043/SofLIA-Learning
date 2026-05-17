import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  buildZonePayload,
  createEmptyZoneFormData,
  mapZoneToFormData,
  type ZoneFormData,
} from './zone-form.model';
import type { FieldUpdater } from './form-field.types';
import type { ZoneFormProps } from './zone-form.types';
import { useHierarchyGeocoding } from './useHierarchyGeocoding';

export function useZoneForm({ isOpen, onClose, onSave, regions, selectedRegionId, zone }: ZoneFormProps) {
  const params = useParams();
  const orgSlug = params?.orgSlug as string;
  const fallbackRegionId = selectedRegionId || regions[0]?.id || '';
  const [formData, setFormData] = useState<ZoneFormData>(() => createEmptyZoneFormData(fallbackRegionId));
  const [error, setError] = useState<string | null>(null);
  const { handleAutoLocate, isGeocoding } = useHierarchyGeocoding(formData, setFormData, setError, orgSlug);

  useEffect(() => {
    setFormData(mapZoneToFormData(zone, fallbackRegionId));
    setError(null);
  }, [zone, isOpen, fallbackRegionId]);

  const regionOptions = useMemo(() => [
    { label: 'Seleccionar región...', value: '' },
    ...regions.map((region) => ({ label: region.name, value: region.id })),
  ], [regions]);

  const updateField: FieldUpdater<ZoneFormData> = (field, value) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!formData.region_id) {
      setError('Selecciona una región');
      return;
    }
    if (!formData.name.trim()) {
      setError('El nombre es requerido');
      return;
    }

    try {
      await onSave(buildZonePayload(formData));
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Error al guardar');
    }
  };

  return { error, formData, handleAutoLocate, handleSubmit, isGeocoding, regionOptions, updateField };
}
