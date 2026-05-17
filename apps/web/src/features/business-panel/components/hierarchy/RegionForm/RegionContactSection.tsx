import { Mail } from 'lucide-react';
import { Section } from '../HierarchyForms';
import { RegionTextField } from './RegionTextField';
import type { RegionFieldUpdater, RegionFormData } from './types';

interface RegionContactSectionProps {
  formData: RegionFormData;
  isLoading?: boolean;
  onFieldChange: RegionFieldUpdater;
}

export function RegionContactSection({
  formData,
  isLoading,
  onFieldChange
}: RegionContactSectionProps) {
  return (
    <Section title="Contacto" icon={<Mail className="w-5 h-5 text-amber-500" />} defaultOpen={false}>
      <div className="grid grid-cols-2 gap-4">
        <RegionTextField
          field="phone"
          label="Telefono"
          type="tel"
          value={formData.phone}
          onChange={onFieldChange}
          placeholder="+52 555 123 4567"
          disabled={isLoading}
        />
        <RegionTextField
          field="email"
          label="Email"
          type="email"
          value={formData.email}
          onChange={onFieldChange}
          placeholder="region@empresa.com"
          disabled={isLoading}
        />
      </div>
    </Section>
  );
}
