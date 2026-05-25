import { Section } from './Section';
import { TextInputField } from './InputFields';
import { sectionIcons } from './SectionIcons';
import type { FieldUpdater } from './form-field.types';
import type { LocationContactFormFields } from './form-values';

interface ContactSectionProps<TFormData extends LocationContactFormFields> {
  disabled?: boolean;
  formData: TFormData;
  updateField: FieldUpdater<TFormData>;
}

export function ContactSection<TFormData extends LocationContactFormFields>({
  disabled,
  formData,
  updateField,
}: ContactSectionProps<TFormData>) {
  return (
    <Section title="Contacto" icon={sectionIcons.contact} defaultOpen={false}>
      <div className="grid grid-cols-2 gap-4">
        <TextInputField field="phone" label="Teléfono" value={formData.phone} onChange={updateField} disabled={disabled} />
        <TextInputField field="email" label="Email" value={formData.email} onChange={updateField} disabled={disabled} />
      </div>
    </Section>
  );
}
