import { Loader2, MapPin } from 'lucide-react';
import { Section } from '../HierarchyForms';
import { hasGeocodingInput } from './region-form.mapper';
import { RegionTextField } from './RegionTextField';
import type { RegionFieldUpdater, RegionFormData } from './types';

interface RegionLocationSectionProps {
  formData: RegionFormData;
  isGeocoding: boolean;
  isLoading?: boolean;
  onAutoLocate: () => void;
  onFieldChange: RegionFieldUpdater;
}

export function RegionLocationSection({
  formData,
  isGeocoding,
  isLoading,
  onAutoLocate,
  onFieldChange
}: RegionLocationSectionProps) {
  return (
    <Section title="Ubicacion" icon={<MapPin className="w-5 h-5 text-emerald-500" />} defaultOpen={false}>
      <RegionTextField field="address" label="Direccion" value={formData.address} onChange={onFieldChange} placeholder="Calle, numero, colonia..." disabled={isLoading} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <RegionTextField field="city" label="Ciudad" value={formData.city} onChange={onFieldChange} placeholder="Ciudad" disabled={isLoading} />
        <RegionTextField field="state" label="Estado" value={formData.state} onChange={onFieldChange} placeholder="Estado" disabled={isLoading} />
        <RegionTextField field="postal_code" label="C.P." value={formData.postal_code} onChange={onFieldChange} placeholder="00000" disabled={isLoading} />
        <RegionTextField field="country" label="Pais" value={formData.country} onChange={onFieldChange} placeholder="Pais" disabled={isLoading} />
      </div>
      <div className="mt-4 pt-4 border-t border-dashed border-neutral-200 dark:border-neutral-700">
        <div className="flex justify-end mb-2">
          <button
            type="button"
            onClick={onAutoLocate}
            disabled={isGeocoding || !hasGeocodingInput(formData)}
            className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
          >
            {isGeocoding ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
            Calcular coordenadas desde direccion
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <RegionTextField field="latitude" label="Latitud" type="number" step={0.000001} value={formData.latitude} onChange={onFieldChange} placeholder="Ej: 19.4326" disabled={isLoading} />
          <RegionTextField field="longitude" label="Longitud" type="number" step={0.000001} value={formData.longitude} onChange={onFieldChange} placeholder="Ej: -99.1332" disabled={isLoading} />
        </div>
      </div>
    </Section>
  );
}
