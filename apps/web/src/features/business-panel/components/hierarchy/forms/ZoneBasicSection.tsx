import { Section } from './Section';
import { SelectField, TextAreaField, TextInputField } from './InputFields';
import { sectionIcons } from './SectionIcons';
import type { FieldUpdater, SelectOption } from './form-field.types';
import type { ZoneFormData } from './zone-form.model';

interface ZoneBasicSectionProps {
  disabled?: boolean;
  formData: ZoneFormData;
  isEditing: boolean;
  regionOptions: SelectOption[];
  updateField: FieldUpdater<ZoneFormData>;
}

export function ZoneBasicSection({
  disabled,
  formData,
  isEditing,
  regionOptions,
  updateField,
}: ZoneBasicSectionProps) {
  return (
    <Section title="Información Básica" icon={sectionIcons.info}>
      <SelectField
        field="region_id"
        label="Región"
        value={formData.region_id}
        onChange={updateField}
        disabled={disabled || isEditing}
        options={regionOptions}
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <TextInputField field="name" label="Nombre" value={formData.name} onChange={updateField} placeholder="Ej: Zona Centro" disabled={disabled} required />
        <TextInputField field="code" label="Código" value={formData.code} onChange={updateField} placeholder="Ej: ZONE-C01" disabled={disabled} />
      </div>
      <TextAreaField
        field="description"
        label="Descripción"
        value={formData.description}
        onChange={updateField}
        disabled={disabled}
      />
    </Section>
  );
}
