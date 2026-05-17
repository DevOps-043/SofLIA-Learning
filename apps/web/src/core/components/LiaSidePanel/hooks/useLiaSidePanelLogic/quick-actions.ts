import { useCallback, useMemo, useState } from 'react';
import { HelpCircle, Lightbulb, MessageSquare, Sparkles } from 'lucide-react';
import type { LiaQuickAction } from '../../types';

type Translate = (key: string) => string;

export function useLiaSidePanelQuickActions(
  t: Translate,
  sendMessage: (message: string) => Promise<void>
) {
  const [usedQuickActionIds, setUsedQuickActionIds] = useState<Set<string>>(new Set());
  const quickActions: LiaQuickAction[] = useMemo(
    () => [
      {
        id: 'capabilities',
        label: t('lia.quickActions.capabilities'),
        icon: HelpCircle,
        prompt: t('lia.quickActions.capabilities'),
      },
      {
        id: 'courses',
        label: t('lia.quickActions.courses'),
        icon: MessageSquare,
        prompt: t('lia.quickActions.courses'),
      },
      {
        id: 'recommend',
        label: t('lia.quickActions.recommend'),
        icon: Lightbulb,
        prompt: t('lia.quickActions.recommend'),
      },
      {
        id: 'help',
        label: t('lia.quickActions.help'),
        icon: Sparkles,
        prompt: t('lia.quickActions.help'),
      },
    ],
    [t]
  );
  const visibleQuickActions = quickActions.filter(
    (action) => !usedQuickActionIds.has(action.id)
  );
  const handleQuickAction = useCallback(
    async (action: LiaQuickAction) => {
      setUsedQuickActionIds((prev) => new Set(prev).add(action.id));
      await sendMessage(action.prompt);
    },
    [sendMessage]
  );

  return { quickActions: visibleQuickActions, handleQuickAction };
}
