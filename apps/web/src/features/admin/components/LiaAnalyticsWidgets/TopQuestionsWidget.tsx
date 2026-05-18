'use client';

import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useState, useEffect } from 'react';
import { ChatBubbleLeftRightIcon, SparklesIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

interface TopQuestion {
  question: string;
  count: number;
  category: string;
  avgResponseTime: number;
  sentiment: 'positive' | 'neutral' | 'negative';
}

interface TopQuestionsWidgetProps {
  period?: string;
  limit?: number;
  isLoading?: boolean;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  course: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', icon: '📚' },
  general: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', icon: '💬' },
  activity: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', icon: '✍️' },
  technical: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', icon: '⚙️' },
  concept: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-300', icon: '💡' },
  other: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', icon: '❓' },
};

export function TopQuestionsWidget({ period = 'month', limit = 8, isLoading: externalLoading }: TopQuestionsWidgetProps) {
  const [questions, setQuestions] = useState<TopQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [topCategory, setTopCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/admin/lia-analytics/top-questions?period=${period}&limit=${limit}`);
        const result = await response.json();

        if (result.success) {
          setQuestions(result.data.questions);
          setTotalQuestions(result.data.totalQuestions);
          setTopCategory(result.data.topCategory);
        }
      } catch (error) {
        techDebtLogger.error('Error fetching top questions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [period, limit]);

  const getCategoryStyle = (category: string) => {
    return CATEGORY_COLORS[category] || CATEGORY_COLORS.other;
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-500';
      case 'negative': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  if (isLoading || externalLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <ChatBubbleLeftRightIcon className="w-5 h-5 text-violet-500" />
            Temas Frecuentes
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {totalQuestions.toLocaleString()} preguntas analizadas
          </p>
        </div>
        {topCategory && (
          <div className={`px-3 py-1.5 rounded-full ${getCategoryStyle(topCategory).bg}`}>
            <span className={`text-xs font-medium ${getCategoryStyle(topCategory).text}`}>
              {getCategoryStyle(topCategory).icon} Top: {topCategory}
            </span>
          </div>
        )}
      </div>

      {/* Questions List */}
      {questions.length === 0 ? (
        <div className="text-center py-8">
          <QuestionMarkCircleIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No hay suficientes datos</p>
        </div>
      ) : (
        <div className="space-y-2">
          {questions.map((q, index) => {
            const style = getCategoryStyle(q.category);
            const maxCount = questions[0]?.count || 1;
            const widthPercent = (q.count / maxCount) * 100;

            return (
              <div
                key={index}
                className="relative group"
              >
                {/* Progress bar background */}
                <div 
                  className={`absolute inset-0 ${style.bg} rounded-lg transition-all duration-300 opacity-50 group-hover:opacity-70`}
                  style={{ width: `${widthPercent}%` }}
                />
                
                {/* Content */}
                <div className="relative p-3 flex items-center gap-3">
                  {/* Rank */}
                  <div className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${index < 3 
                      ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}
                  `}>
                    {index + 1}
                  </div>

                  {/* Question text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white truncate font-medium">
                      {q.question}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs ${style.text}`}>
                        {style.icon} {q.category}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {q.avgResponseTime}ms avg
                      </span>
                    </div>
                  </div>

                  {/* Count */}
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${getSentimentColor(q.sentiment)}`}>
                      {q.sentiment === 'positive' ? '😊' : q.sentiment === 'negative' ? '😟' : '😐'}
                    </span>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {q.count}
                      </p>
                      <p className="text-xs text-gray-500">veces</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer insight */}
      {questions.length > 0 && (
        <div className="mt-4 p-3 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-lg">
          <div className="flex items-start gap-2">
            <SparklesIcon className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-600 dark:text-gray-300">
              <span className="font-semibold">Insight:</span> Las preguntas sobre{' '}
              <span className="text-violet-600 dark:text-violet-400 font-medium">{topCategory}</span>{' '}
              representan la mayoría de consultas. Considera mejorar el contenido en esta área.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
