import type { TFunction } from 'i18next';
import type { useAIChatAgentLogic } from '../hooks/useAIChatAgentLogic';

export type AIChatAgentLogic = ReturnType<typeof useAIChatAgentLogic>;
export type CommonTranslator = TFunction<'common'>;

export interface ChatPanelUser {
  display_name?: string;
  profile_picture_url?: string;
  username?: string;
}
