'use client';

import { logger as techDebtLogger } from '@/lib/utils/logger'
import { Fragment, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  AcademicCapIcon, 
  CurrencyDollarIcon, 
  ChatBubbleLeftRightIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

interface CourseMetric {
  courseId: string;
  title: string;
  totalConversations: number;
  uniqueUsers: number;
  totalMessages: number;
  totalTokens: number;
  totalCost: number;
  avgDurationSeconds: number;
  topModules: Array<{
    moduleId: string;
    title: string;
    conversations: number;
    tokens: number;
    totalCost: number;
  }>;
}

interface CourseAnalyticsResponse {
  courses: CourseMetric[];
  period: {
    start: string;
    end: string;
    type: string;
  };
}

interface CourseAnalyticsWidgetProps {
  period: string;
  isLoading?: boolean; // Prop opcional si queremos controlar carga desde fuera, aunque este widget hará su propio fetch
}

export function CourseAnalyticsWidget({ period }: CourseAnalyticsWidgetProps) {
  const { t } = useTranslation('admin');
  const [data, setData] = useState<CourseMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'cost' | 'conversations' | 'users'>('cost');
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  const fetchCourseData = useCallback(async () => {
    setIsLoading(true);
    try {
        const timestamp = Date.now();
        const response = await fetch(`/api/admin/lia-analytics/courses?period=${period}&_t=${timestamp}`, {
            cache: 'no-store'
        });
        const result = await response.json();
        
        if (result.success) {
            setData(result.data.courses);
        } else {
            setError(result.error);
        }
    } catch (err) {
        setError(t('liaAnalyticsPage.courseAnalytics.error'));
        techDebtLogger.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [period, t]);

  useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]);

  const sortedData = [...data].sort((a, b) => {
    if (sortBy === 'cost') return b.totalCost - a.totalCost;
    if (sortBy === 'conversations') return b.totalConversations - a.totalConversations;
    if (sortBy === 'users') return b.uniqueUsers - a.uniqueUsers;
    return 0;
  });

  const toggleExpand = (courseId: string) => {
    if (expandedCourse === courseId) {
        setExpandedCourse(null);
    } else {
        setExpandedCourse(courseId);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 h-96">
        <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <AcademicCapIcon className="w-5 h-5 text-indigo-500" />
                {t('liaAnalyticsPage.courseAnalytics.title')}
            </h3>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded-lg w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 text-center text-red-500">
            <p>{error}</p>
        </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <AcademicCapIcon className="w-5 h-5 text-indigo-500" />
            {t('liaAnalyticsPage.courseAnalytics.title')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('liaAnalyticsPage.courseAnalytics.description')}
          </p>
        </div>
        
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 text-xs font-medium">
            <button 
                onClick={() => setSortBy('cost')}
                className={`px-3 py-1.5 rounded-md transition-all ${sortBy === 'cost' ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}
            >
                {t('liaAnalyticsPage.courseAnalytics.sort.cost')}
            </button>
            <button 
                onClick={() => setSortBy('conversations')}
                className={`px-3 py-1.5 rounded-md transition-all ${sortBy === 'conversations' ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}
            >
                {t('liaAnalyticsPage.courseAnalytics.sort.conversations')}
            </button>
            <button 
                onClick={() => setSortBy('users')}
                className={`px-3 py-1.5 rounded-md transition-all ${sortBy === 'users' ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}
            >
                {t('liaAnalyticsPage.courseAnalytics.sort.users')}
            </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 font-medium">
            <tr>
              <th className="px-6 py-3">{t('liaAnalyticsPage.courseAnalytics.table.course')}</th>
              <th className="px-6 py-3 text-right">{t('liaAnalyticsPage.courseAnalytics.table.totalCost')}</th>
              <th className="px-6 py-3 text-right">{t('liaAnalyticsPage.courseAnalytics.table.conversations')}</th>
              <th className="px-6 py-3 text-right">{t('liaAnalyticsPage.courseAnalytics.table.messages')}</th>
              <th className="px-6 py-3 text-right">{t('liaAnalyticsPage.courseAnalytics.table.uniqueUsers')}</th>
              <th className="px-6 py-3 text-right">Tokens</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedData.length > 0 ? (
                sortedData.map((course, index) => (
                <Fragment key={course.courseId || `${course.title}-${index}`}>
                    <tr 
                        onClick={() => toggleExpand(course.courseId)}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors"
                    >
                        <td className="px-6 py-4">
                            <div className="font-medium text-gray-900 dark:text-white">{course.title}</div>
                            {course.topModules?.length > 0 && (
                                <div className="text-xs text-indigo-500 mt-0.5 flex items-center gap-1">
                                    {expandedCourse === course.courseId ? t('liaAnalyticsPage.courseAnalytics.hideDetails') : t('liaAnalyticsPage.courseAnalytics.showModuleBreakdown')}
                                </div>
                            )}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-emerald-600 dark:text-emerald-400">
                            ${course.totalCost.toFixed(4)}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-700 dark:text-gray-300">
                            {course.totalConversations}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-500 dark:text-gray-400">
                            {course.totalMessages}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-500 dark:text-gray-400">
                            {course.uniqueUsers}
                        </td>
                        <td className="px-6 py-4 text-right text-xs font-mono text-gray-500 dark:text-gray-500">
                            {(course.totalTokens / 1000).toFixed(1)}k
                        </td>
                    </tr>
                    {expandedCourse === course.courseId && course.topModules?.length > 0 && (
                        <tr className="bg-gray-50/50 dark:bg-gray-800/50">
                            <td colSpan={6} className="px-6 py-4">
                                <div className="ml-4 pl-4 border-l-2 border-indigo-200 dark:border-indigo-800">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                        {t('liaAnalyticsPage.courseAnalytics.topModules')}
                                    </h4>
                                    <div className="space-y-2">
                                        {course.topModules.map(mod => (
                                            <div key={mod.moduleId} className="flex items-center justify-between text-sm">
                                                <span className="text-gray-700 dark:text-gray-300 truncate max-w-xs">{mod.title}</span>
                                                <div className="flex items-center gap-4 text-xs">
                                                    <span className="text-gray-500">{t('liaAnalyticsPage.courseAnalytics.conversationsShort', { count: mod.conversations })}</span>
                                                    <span className="font-mono text-emerald-600 dark:text-emerald-500">${mod.totalCost.toFixed(4)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </td>
                        </tr>
                    )}
                </Fragment>
                ))
            ) : (
                <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        {t('liaAnalyticsPage.courseAnalytics.empty')}
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
