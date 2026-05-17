import type { ManagerInfo } from '../../../types/hierarchy.types';
import { getManagerDisplayName } from '../../../types/hierarchy.types';
import { Section } from './Section';
import { SelectField, TextAreaField, TextInputField } from './InputFields';
import { sectionIcons } from './SectionIcons';
import type { FieldUpdater, SelectOption } from './form-field.types';
import type { TeamFormData } from './team-form.model';

interface TeamBasicSectionProps {
  disabled?: boolean;
  formData: TeamFormData;
  isEditing: boolean;
  leaders: ManagerInfo[];
  updateField: FieldUpdater<TeamFormData>;
  zoneOptions: SelectOption[];
}

export function TeamBasicSection({
  disabled,
  formData,
  isEditing,
  leaders,
  updateField,
  zoneOptions,
}: TeamBasicSectionProps) {
  const leaderOptions = [
    { label: 'Sin asignar', value: '' },
    ...leaders.map((leader) => ({ label: getManagerDisplayName(leader), value: leader.id })),
  ];

  return (
    <Section title="Información Básica" icon={sectionIcons.team}>
      <SelectField field="zone_id" label="Zona" value={formData.zone_id} onChange={updateField} disabled={disabled || isEditing} options={zoneOptions} required />
      <div className="grid grid-cols-2 gap-4">
        <TextInputField field="name" label="Nombre" value={formData.name} onChange={updateField} placeholder="Ej: Equipo Ventas" disabled={disabled} required />
        <TextInputField field="code" label="Código" value={formData.code} onChange={updateField} placeholder="Ej: TEAM-V01" disabled={disabled} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <TextInputField field="max_members" label="Máx. miembros" value={formData.max_members} onChange={updateField} placeholder="Sin límite" disabled={disabled} />
        <SelectField field="leader_id" label="Líder de Equipo" value={formData.leader_id} onChange={updateField} disabled={disabled} options={leaderOptions} />
      </div>
      <TextAreaField field="description" label="Descripción" value={formData.description} onChange={updateField} disabled={disabled} />
    </Section>
  );
}
