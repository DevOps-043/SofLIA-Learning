import { ChartPieIcon, ChatBubbleLeftRightIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import type { HeatmapTabId, HeroIcon } from './types';

export const CONTEXT_COLORS: Record<string, string> = {
  course: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  general: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  activity: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  workshop: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
};

export const HEATMAP_TABS: Array<{ icon: HeroIcon; id: HeatmapTabId }> = [
  { id: 'overview', icon: ChartPieIcon },
  { id: 'users', icon: UserGroupIcon },
  { id: 'questions', icon: ChatBubbleLeftRightIcon },
];
