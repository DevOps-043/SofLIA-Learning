/**
 * Types for SofLIA Personalization System
 */

export type BaseStyle = 'professional' | 'casual' | 'technical' | 'friendly' | 'formal';

export interface SofLIAPersonalizationSettings {
  id: string;
  user_id: string;
  base_style: BaseStyle;
  is_friendly: boolean;
  is_enthusiastic: boolean;
  custom_instructions: string | null;
  nickname: string | null;
  voice_enabled: boolean;
  dictation_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface SofLIAPersonalizationSettingsInput {
  base_style?: BaseStyle;
  is_friendly?: boolean;
  is_enthusiastic?: boolean;
  custom_instructions?: string | null;
  nickname?: string | null;
  voice_enabled?: boolean;
  dictation_enabled?: boolean;
}

export interface SofLIAPersonalizationResponse {
  settings: SofLIAPersonalizationSettings | null;
  success: boolean;
  message?: string;
}
