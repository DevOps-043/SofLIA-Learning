import type { SupportedLanguage } from '../../i18n/i18n';
import type { createClient } from '../../../lib/supabase/server';

export type EntityType = 'course' | 'module' | 'lesson' | 'activity' | 'material';
export type TranslationData = Record<string, unknown>;
export type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export interface TranslationResult {
  success: boolean;
  languages: SupportedLanguage[];
  errors?: Partial<Record<SupportedLanguage, string>>;
}

export interface TranslationEntityConfig {
  entityId: string;
  entityType: EntityType;
  entityLabel: string;
  data: TranslationData;
  fields: string[];
  textsToAnalyze: string[];
  context: string;
  userId?: string;
  supabaseClient?: ServerSupabaseClient;
  requireOpenAiKey?: boolean;
}
