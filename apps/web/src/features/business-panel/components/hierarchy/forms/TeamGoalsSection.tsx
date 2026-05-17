import { Section } from './Section';
import { TextAreaField, TextInputField } from './InputFields';
import { sectionIcons } from './SectionIcons';
import type { FieldUpdater } from './form-field.types';
import type { TeamFormData } from './team-form.model';

interface TeamGoalsSectionProps {
  disabled?: boolean;
  formData: TeamFormData;
  updateField: FieldUpdater<TeamFormData>;
}

export function TeamGoalsSection({ disabled, formData, updateField }: TeamGoalsSectionProps) {
  return (
    <Section title="Objetivos y Metas" icon={sectionIcons.goals} defaultOpen={false}>
      <TextAreaField
        field="target_goal"
        label="Objetivo/Meta"
        value={formData.target_goal}
        onChange={updateField}
        placeholder="Descripción del objetivo del equipo..."
        disabled={disabled}
      />
      <TextInputField
        field="monthly_target"
        label="Meta mensual (numérica)"
        value={formData.monthly_target}
        onChange={updateField}
        placeholder="Ej: 100000"
        disabled={disabled}
      />
    </Section>
  );
}
