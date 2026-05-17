import { AboutSection } from './AboutSection';
import { AdvancedSection } from './AdvancedSection';
import { CharacteristicsSection } from './CharacteristicsSection';
import { InstructionsSection } from './InstructionsSection';
import { StyleSection } from './StyleSection';
import type { PersonalizationFormData } from './types';

interface SettingsSectionsProps {
  expandedSections: Record<string, boolean>;
  formData: PersonalizationFormData;
  setFormData: (data: PersonalizationFormData) => void;
  toggleSection: (section: string) => void;
}

export function SettingsSections(props: SettingsSectionsProps) {
  const sectionProps = {
    formData: props.formData,
    setFormData: props.setFormData,
  };

  return (
    <div className="space-y-4">
      <StyleSection
        {...sectionProps}
        isExpanded={props.expandedSections.style}
        onToggle={() => props.toggleSection('style')}
      />
      <CharacteristicsSection
        {...sectionProps}
        isExpanded={props.expandedSections.characteristics}
        onToggle={() => props.toggleSection('characteristics')}
      />
      <InstructionsSection
        {...sectionProps}
        isExpanded={props.expandedSections.instructions}
        onToggle={() => props.toggleSection('instructions')}
      />
      <AboutSection
        {...sectionProps}
        isExpanded={props.expandedSections.about}
        onToggle={() => props.toggleSection('about')}
      />
      <AdvancedSection
        {...sectionProps}
        isExpanded={props.expandedSections.advanced}
        onToggle={() => props.toggleSection('advanced')}
      />
    </div>
  );
}
