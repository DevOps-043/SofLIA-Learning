import { useState, type Dispatch, type SetStateAction } from 'react';
import { geocodeAddress } from './geocode';

interface LocationLookupFields {
  address: string;
  city: string;
  country: string;
  latitude: string;
  longitude: string;
  postal_code: string;
  state: string;
}

export function useHierarchyGeocoding<TFormData extends LocationLookupFields>(
  formData: TFormData,
  setFormData: Dispatch<SetStateAction<TFormData>>,
  setError: (message: string | null) => void,
  orgSlug: string
) {
  const [isGeocoding, setIsGeocoding] = useState(false);

  const handleAutoLocate = async () => {
    setIsGeocoding(true);
    setError(null);

    if (!formData.city && !formData.address) {
      setError('Por favor, ingresa al menos una ciudad o dirección.');
      setIsGeocoding(false);
      return;
    }

    try {
      const coords = await geocodeAddress(formData, orgSlug);
      if (!coords) {
        setError('No se pudo encontrar la ubicación. Intenta con una dirección más específica o verifica la ortografía.');
        return;
      }
      setFormData((previous) => ({ ...previous, latitude: coords.lat, longitude: coords.lon }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error al buscar coordenadas: ${message}. Por favor, intenta de nuevo.`);
    } finally {
      setIsGeocoding(false);
    }
  };

  return { handleAutoLocate, isGeocoding };
}
