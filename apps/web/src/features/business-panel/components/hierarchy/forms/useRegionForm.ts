import { useParams } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import {
  buildRegionPayload,
  createEmptyRegionFormData,
  mapRegionToFormData,
  type RegionFormData,
} from './region-form.model';
import type { FieldUpdater } from './form-field.types';
import type { RegionFormProps } from './region-form.types';
import { useHierarchyGeocoding } from './useHierarchyGeocoding';

export function useRegionForm({ isOpen, onClose, onSave, region }: RegionFormProps) {
  const params = useParams();
  const orgSlug = params?.orgSlug as string;
  const [formData, setFormData] = useState<RegionFormData>(createEmptyRegionFormData);
  const [error, setError] = useState<string | null>(null);
  const { handleAutoLocate, isGeocoding } = useHierarchyGeocoding(
    formData,
    setFormData,
    setError,
    orgSlug
  );

  useEffect(() => {
    setFormData(mapRegionToFormData(region));
    setError(null);
  }, [region, isOpen]);

  const updateField: FieldUpdater<RegionFormData> = (field, value) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('El nombre es requerido');
      return;
    }

    try {
      await onSave(buildRegionPayload(formData));
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Error al guardar');
    }
  };

  return {
    error,
    formData,
    handleAutoLocate,
    handleSubmit,
    isGeocoding,
    updateField,
  };
}
