import { formatDate, formatTime } from './formatters';
import { useTranslation } from 'react-i18next';
import type { HourDetailData } from './types';

interface QuestionsTabProps {
  questions: HourDetailData['topQuestions'];
}

export function QuestionsTab({ questions }: QuestionsTabProps) {
  const { t } = useTranslation('admin');

  if (questions.length === 0) {
    return <p className="py-8 text-center text-gray-500">{t('liaAnalyticsPage.heatmapModal.questions.empty')}</p>;
  }

  return (
    <div className="space-y-3">
      {questions.map((question, index) => (
        <div key={`${question.timestamp}-${index}`} className="rounded-xl bg-gray-50 p-4 dark:bg-gray-700/50">
          <p className="text-sm text-gray-900 dark:text-white">"{question.content}"</p>
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span>
              {formatDate(question.timestamp)} {formatTime(question.timestamp)}
            </span>
            {question.responseTime && (
              <>
                <span>-</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {t('liaAnalyticsPage.heatmapModal.questions.responseTime', { time: question.responseTime })}
                </span>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
