import { Info } from 'lucide-react';
import { Section } from '../HierarchyForms';
import { RegionDescriptionField, RegionTextField } from './RegionTextField';
import type { RegionFieldUpdater, RegionFormData } from './types';

interface RegionBasicSectionProps {
  formData: RegionFormData;
  isLoading?: boolean;
  onFieldChange: RegionFieldUpdater;
}

export function RegionBasicSection({
  formData,
  isLoading,
  onFieldChange
}: RegionBasicSectionProps) {
  return (
    <Section title="Informacion Basica" icon={<Info className="w-5 h-5 text-blue-500" />}>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 md:col-span-1">
          <RegionTextField
            field="name"
            label="Nombre *"
            value={formData.name}
            onChange={onFieldChange}
            placeholder="Ej: Region Norte"
            disabled={isLoading}
          />
        </div>
        <RegionTextField
          field="code"
          label="Codigo"
          value={formData.code}
          onChange={onFieldChange}
          placeholder="Ej: REG-N01"
          disabled={isLoading}
        />
      </div>
      <RegionDescriptionField
        value={formData.description}
        onChange={onFieldChange}
        disabled={isLoading}
      />
    </Section>
  );
}
