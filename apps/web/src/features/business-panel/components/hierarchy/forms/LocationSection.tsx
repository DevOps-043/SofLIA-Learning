import { Loader2, MapPin } from 'lucide-react';
import { Section } from './Section';
import { TextInputField } from './InputFields';
import { sectionIcons } from './SectionIcons';
import type { FieldUpdater } from './form-field.types';
import type { LocationContactFormFields } from './form-values';

interface LocationSectionProps<TFormData extends LocationContactFormFields> {
  disabled?: boolean;
  formData: TFormData;
  isGeocoding: boolean;
  onAutoLocate: () => void;
  updateField: FieldUpdater<TFormData>;
}

export function LocationSection<TFormData extends LocationContactFormFields>({
  disabled,
  formData,
  isGeocoding,
  onAutoLocate,
  updateField,
}: LocationSectionProps<TFormData>) {
  const canAutoLocate = Boolean(formData.address || formData.city);

  return (
    <Section title="Ubicación" icon={sectionIcons.location} defaultOpen={false}>
      <TextInputField
        field="address"
        label="Dirección"
        value={formData.address}
        onChange={updateField}
        disabled={disabled}
        placeholder="Calle, número, colonia..."
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <TextInputField field="city" label="Ciudad" value={formData.city} onChange={updateField} disabled={disabled} />
        <TextInputField field="state" label="Estado" value={formData.state} onChange={updateField} disabled={disabled} />
        <TextInputField field="postal_code" label="C.P." value={formData.postal_code} onChange={updateField} disabled={disabled} />
        <TextInputField field="country" label="País" value={formData.country} onChange={updateField} disabled={disabled} />
      </div>
      <div className="mt-4 pt-4 border-t border-dashed border-neutral-200 dark:border-neutral-700">
        <div className="flex justify-end mb-2">
          <button
            type="button"
            onClick={onAutoLocate}
            disabled={isGeocoding || !canAutoLocate}
            className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
          >
            {isGeocoding ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
            Calcular coordenadas desde dirección
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <TextInputField
            field="latitude"
            label="Latitud"
            value={formData.latitude}
            onChange={updateField}
            disabled={disabled}
            placeholder="Ej: 19.4326"
          />
          <TextInputField
            field="longitude"
            label="Longitud"
            value={formData.longitude}
            onChange={updateField}
            disabled={disabled}
            placeholder="Ej: -99.1332"
          />
        </div>
      </div>
    </Section>
  );
}
