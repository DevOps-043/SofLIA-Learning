import { motion } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';
import type { TFunction } from 'i18next';
import type { LessonFormData } from './types';

interface LessonContentAiPanelProps {
  formData: LessonFormData;
  generatingAI: boolean;
  onGenerateAI: () => void;
  t: TFunction<'admin'>;
}

export function LessonContentAiPanel({ formData, generatingAI, onGenerateAI, t }: LessonContentAiPanelProps) {
  const missingRequirements =
    !formData.video_provider_id ||
    (formData.video_provider !== 'direct' && formData.video_provider !== 'custom');

  return (
    <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 dark:from-purple-500/20 dark:to-blue-500/20 border border-purple-500/20 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg text-white">
            <SparklesIcon className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-semibold text-primary dark:text-white">{t('workshops.editor.lessons.aiTitle')}</h4>
            <p className="text-xs text-gray-500 dark:text-white/70">{t('workshops.editor.lessons.aiDescription')}</p>
          </div>
        </div>
        <motion.button
          type="button"
          onClick={onGenerateAI}
          disabled={generatingAI || !formData.video_provider_id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-sm font-medium shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {generatingAI ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{t('workshops.editor.lessons.aiAnalyzing')}</span>
            </>
          ) : (
            <>
              <SparklesIcon className="h-4 w-4" />
              <span>{t('workshops.editor.lessons.aiGenerateButton')}</span>
            </>
          )}
        </motion.button>
      </div>
      {missingRequirements && <p className="text-xs text-orange-500 mt-2 ml-1">{t('workshops.editor.lessons.aiRequirements')}</p>}
    </div>
  );
}
