import type {
  BaseStyle,
  SofLIAPersonalizationSettings,
  SofLIAPersonalizationSettingsInput,
} from '@/core/types/lia-personalization.types';

export type PersonalizationBaseStyle = BaseStyle;
export type PersonalizationFormData = SofLIAPersonalizationSettingsInput;

export interface PersonalizationController {
  error: string | null;
  loading: boolean;
  resetSettings: () => Promise<void>;
  settings: SofLIAPersonalizationSettings | null;
  updateSettings: (settings: SofLIAPersonalizationSettingsInput) => Promise<void>;
}

export interface PersonalizationSettingsModalProps {
  controller: PersonalizationController;
  isOpen: boolean;
  onClose: () => void;
  title: string;
}
