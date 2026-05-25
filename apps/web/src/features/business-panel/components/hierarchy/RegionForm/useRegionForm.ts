'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { Region } from '../../../types/hierarchy.types';
import { geocodeAddress } from '../HierarchyForms';
import {
  createRegionFormData,
  createRegionPayload,
  hasGeocodingInput
} from './region-form.mapper';
import type { RegionFormData, RegionFormField } from './types';

interface UseRegionFormParams {
  region?: Region | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Region>) => Promise<void>;
}

export function useRegionForm({
  region,
  isOpen,
  onClose,
  onSave
}: UseRegionFormParams) {
  const params = useParams();
  const orgSlug = params?.orgSlug as string;
  const [formData, setFormData] = useState<RegionFormData>(() =>
    createRegionFormData(region)
  );
  const [error, setError] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  useEffect(() => {
    setFormData(createRegionFormData(region));
    setError(null);
  }, [region, isOpen]);

  const updateField = (field: RegionFormField, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleAutoLocate = async () => {
    setIsGeocoding(true);
    setError(null);

    if (!hasGeocodingInput(formData)) {
      setError('Por favor, ingresa al menos una ciudad o direccion.');
      setIsGeocoding(false);
      return;
    }

    try {
      const coords = await geocodeAddress(formData, orgSlug);
      if (!coords) {
        setError('No se pudo encontrar la ubicacion. Intenta con una direccion mas especifica.');
        return;
      }

      setFormData((current) => ({
        ...current,
        latitude: coords.lat,
        longitude: coords.lon
      }));
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Error desconocido';
      setError(`Error al buscar coordenadas: ${message}. Por favor, intenta de nuevo.`);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('El nombre es requerido');
      return;
    }

    try {
      await onSave(createRegionPayload(formData));
      onClose();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Error al guardar');
    }
  };

  return {
    error,
    formData,
    isGeocoding,
    handleAutoLocate,
    handleSubmit,
    updateField
  };
}
