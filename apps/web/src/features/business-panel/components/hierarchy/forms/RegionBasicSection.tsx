import { Section } from './Section';
import { TextAreaField, TextInputField } from './InputFields';
import { sectionIcons } from './SectionIcons';
import type { FieldUpdater } from './form-field.types';
import type { RegionFormData } from './region-form.model';

interface RegionBasicSectionProps {
  disabled?: boolean;
  formData: RegionFormData;
  updateField: FieldUpdater<RegionFormData>;
}

export function RegionBasicSection({ disabled, formData, updateField }: RegionBasicSectionProps) {
  return (
    <Section title="Información Básica" icon={sectionIcons.info}>
      <div className="grid grid-cols-2 gap-4">
        <TextInputField
          className="col-span-2 md:col-span-1"
          field="name"
          label="Nombre"
          value={formData.name}
          onChange={updateField}
          placeholder="Ej: Región Norte"
          disabled={disabled}
          required
        />
        <TextInputField
          field="code"
          label="Código"
          value={formData.code}
          onChange={updateField}
          placeholder="Ej: REG-N01"
          disabled={disabled}
        />
      </div>
      <TextAreaField
        field="description"
        label="Descripción"
        value={formData.description}
        onChange={updateField}
        placeholder="Descripción de la región..."
        disabled={disabled}
      />
    </Section>
  );
}
