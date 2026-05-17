'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { type AIChatAgentProps } from './types';
import { useAIChatAgentLogic } from './hooks/useAIChatAgentLogic';
import { ChatFloatingButton } from './ChatFloatingButton';
import { AIChatAgentModals } from './components/AIChatAgentModals';
import { AIChatWidgetPanel } from './components/AIChatWidgetPanel';
import { InlinePromptPreviewPanel } from './components/InlinePromptPreviewPanel';

export function AIChatAgent({
  assistantName = 'SofLIA',
  assistantAvatar = '/lia-avatar.webp',
  initialMessage,
  promptPlaceholder,
  context = 'general',
}: AIChatAgentProps) {
  const router = useRouter();
  const { t: tCommon } = useTranslation('common');
  const { user } = useAuth();
  const logic = useAIChatAgentLogic({ assistantName, context, initialMessage, promptPlaceholder });

  return (
    <>
      {!logic.isOpen ? (
        <ChatFloatingButton
          bottomPosition={logic.bottomPosition}
          assistantAvatar={assistantAvatar}
          assistantName={assistantName}
          hasUnreadMessages={logic.hasUnreadMessages}
          areButtonsExpanded={logic.areButtonsExpanded}
          setAreButtonsExpanded={logic.setAreButtonsExpanded}
          setIsReportOpen={logic.setIsReportOpen}
          reportProblemLabel={logic.reportProblemLabel}
          handleToggle={logic.handleToggle}
        />
      ) : null}

      <InlinePromptPreviewPanel logic={logic} tCommon={tCommon} />
      <AIChatWidgetPanel
        assistantAvatar={assistantAvatar}
        assistantName={assistantName}
        logic={logic}
        onNavigate={(url) => router.push(url)}
        promptPlaceholder={promptPlaceholder}
        user={user}
      />
      <AIChatAgentModals logic={logic} />
    </>
  );
}
