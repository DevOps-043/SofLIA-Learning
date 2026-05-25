import type { ManagerInfo } from '../../../types/hierarchy.types';
import { getManagerDisplayName } from '../../../types/hierarchy.types';
import { Section } from './Section';
import { SelectField } from './InputFields';
import { sectionIcons } from './SectionIcons';
import type { FieldUpdater } from './form-field.types';

interface ManagerSectionProps<TFormData> {
  disabled?: boolean;
  emptyMessage: string;
  field: keyof TFormData;
  formData: TFormData;
  label: string;
  managers: ManagerInfo[];
  title: string;
  updateField: FieldUpdater<TFormData>;
}

export function ManagerSection<TFormData extends object>({
  disabled,
  emptyMessage,
  field,
  formData,
  label,
  managers,
  title,
  updateField,
}: ManagerSectionProps<TFormData>) {
  const options = [
    { label: 'Sin asignar', value: '' },
    ...managers.map((manager) => ({
      label: `${getManagerDisplayName(manager)} (${manager.email})`,
      value: manager.id,
    })),
  ];

  return (
    <Section title={title} icon={sectionIcons.leader} defaultOpen={false}>
      <SelectField
        field={field}
        label={label}
        value={String(formData[field] ?? '')}
        onChange={updateField}
        disabled={disabled || managers.length === 0}
        options={options}
      />
      {managers.length === 0 && <p className="text-xs text-neutral-500 mt-1">{emptyMessage}</p>}
    </Section>
  );
}
