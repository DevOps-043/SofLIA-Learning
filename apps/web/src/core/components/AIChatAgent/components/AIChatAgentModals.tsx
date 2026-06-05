'use client';

import { AnimatePresence } from 'framer-motion';
import { SofLIAPersonalizationSettings } from '../../../../features/lia/components/SofLIAPersonalizationSettings';
import { ReporteProblema } from '../../ReporteProblema/ReporteProblema';
import { ClearConfirmModal } from '../ClearConfirmModal';
import { NanoBananaPreviewPanel } from '../NanoBananaPreviewPanel';
import { PromptPreviewPanel, type PromptDraft } from '../PromptPreviewPanel';
import type { AIChatAgentLogic } from './ai-chat-agent-view.types';

interface AIChatAgentModalsProps {
  logic: AIChatAgentLogic;
}

export function AIChatAgentModals({ logic }: AIChatAgentModalsProps) {
  return (
    <>
      <ReporteProblema isOpen={logic.isReportOpen} onClose={() => logic.setIsReportOpen(false)} fromLia={true} />
      <ClearConfirmModal show={logic.showClearConfirm} normalMessagesCount={logic.normalMessages.length} onCancel={() => logic.setShowClearConfirm(false)} onConfirm={logic.executeClearConversation} />

      {(logic.promptSaveSuccess || logic.promptSaveError) ? (
        <div className={`fixed bottom-4 left-1/2 z-[9999] -translate-x-1/2 rounded-lg border px-4 py-3 text-sm ${logic.promptSaveSuccess ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
          {logic.promptSaveSuccess || logic.promptSaveError}
        </div>
      ) : null}

      <AnimatePresence>
        {logic.isPromptMode && logic.generatedPrompt && logic.isPromptPanelOpen ? (
          <PromptPreviewPanel
            draft={logic.generatedPrompt as PromptDraft}
            onSave={logic.handleSavePrompt}
            onClose={() => logic.setIsPromptPanelOpen(false)}
            onEdit={(editedDraft) => logic.setGeneratedPrompt(editedDraft)}
            isSaving={logic.isSavingPrompt}
          />
        ) : null}
      </AnimatePresence>

      {logic.nanoBananaSchema && logic.isNanoBananaPanelOpen ? (
        <div className="fixed right-4 top-20 z-[100001]" style={{ width: 'min(400px, calc(100vw - 2rem))', maxHeight: 'calc(var(--soflia-viewport-height) - 6rem)' }}>
          <NanoBananaPreviewPanel
            schema={logic.nanoBananaSchema}
            jsonString={logic.nanoBananaJsonString}
            domain={logic.nanoBananaDomain}
            outputFormat={logic.nanoBananaFormat}
            isOpen={logic.isNanoBananaPanelOpen}
            onClose={() => logic.setIsNanoBananaPanelOpen(false)}
            onCopy={() => {}}
            onDownload={() => {}}
            onRegenerate={() => {
              const lastUserMessage = logic.nanoBananaMessages.filter((message: { role: string }) => message.role === 'user').pop();
              if (lastUserMessage) logic.setInputMessage((lastUserMessage as { content: string }).content);
            }}
          />
        </div>
      ) : null}

      <SofLIAPersonalizationSettings isOpen={logic.isPersonalizationOpen} onClose={() => logic.setIsPersonalizationOpen(false)} />
    </>
  );
}
