'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Download, MessageSquare, Sparkles, Target, X } from 'lucide-react';
import type { ReactNode } from 'react';
import type { AIChatAgentLogic, CommonTranslator } from './ai-chat-agent-view.types';

interface InlinePromptPreviewPanelProps {
  logic: AIChatAgentLogic;
  tCommon: CommonTranslator;
}

export function InlinePromptPreviewPanel({ logic, tCommon }: InlinePromptPreviewPanelProps) {
  const isVisible = logic.isPromptMode && logic.generatedPrompt && logic.isPromptPanelOpen;

  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="fixed right-6 z-[100000] w-96 max-w-[calc(100vw-3rem)]"
          style={{ bottom: logic.promptBottomPosition, height: logic.calculateMaxHeight, maxHeight: logic.calculateMaxHeight }}
        >
          <div className="rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-[#0A2540]/30 flex flex-col bg-white dark:bg-[#1E2329] h-full">
            <PromptPreviewHeader logic={logic} title={tCommon('aiChat.promptMode.viewGenerated')} />
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-[#0a0a0a] min-h-0 overscroll-contain" style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}>
              <PromptInfoCard icon={<Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />} label={tCommon('aiChat.promptMode.titleLabel')} value={logic.generatedPrompt!.title} />
              <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-gray-200 dark:border-slate-600/30">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#00D4B3]" />
                  <span className="text-sm">{tCommon('aiChat.promptMode.contentLabel')}</span>
                </h4>
                <div className="text-gray-700 dark:text-slate-300 text-sm prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed break-words">{logic.generatedPrompt!.content}</pre>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {logic.generatedPrompt!.tags.slice(0, 3).map((tag: string, index: number) => (
                  <span key={index} className="px-3 py-1 bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded-full text-xs">{tag}</span>
                ))}
              </div>
              <motion.button
                onClick={logic.handleDownloadPrompt}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-[#0A2540] to-[#0A2540] hover:from-[#0d2f4d] hover:to-[#0d2f4d] text-white py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-sm"
              >
                <Download className="w-4 h-4" />
                {tCommon('aiChat.promptMode.download')}
              </motion.button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function PromptPreviewHeader({ logic, title }: { logic: AIChatAgentLogic; title: string }) {
  return (
    <motion.div className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 p-4 relative overflow-hidden flex-shrink-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
      <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" animate={{ x: ['-100%', '100%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative p-2 rounded-lg bg-white/20 backdrop-blur-sm"><Sparkles className="w-5 h-5 text-white" /></div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
        </div>
        <button onClick={() => { logic.setIsPromptPanelOpen(false); logic.setGeneratedPrompt(null); logic.setSelectedPromptMessageId(null); }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors text-white">
          <X className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}

function PromptInfoCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-gray-200 dark:border-slate-600/30">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">{icon}<span className="text-sm">{label}</span></h4>
      </div>
      <p className="text-gray-700 dark:text-slate-300 text-sm break-words">{value}</p>
    </div>
  );
}
