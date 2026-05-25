import type { ComponentType, SVGProps } from 'react';

export interface HourDetailData {
  slot: {
    dayOfWeek: number;
    dayName: string;
    hour: number;
    hourFormatted: string;
  };
  summary: {
    totalMessages: number;
    userMessages: number;
    assistantMessages: number;
    uniqueUsers: number;
    uniqueConversations: number;
    totalTokens: number;
    totalCost: number;
    avgResponseTime: number;
  };
  topUsers: Array<{
    name: string;
    email?: string;
    avatar?: string;
    messageCount: number;
    conversationCount: number;
    questions: string[];
    tokens: number;
    cost: number;
  }>;
  topQuestions: Array<{
    content: string;
    timestamp: string;
    responseTime: number | null;
  }>;
  contextDistribution: Array<{ context: string; count: number; percentage: number }>;
  modelsUsed: Array<{ model: string; count: number }>;
  activityDates: string[];
}

export interface HeatmapDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayOfWeek: number;
  hour: number;
  period: string;
}

export type HeatmapTabId = 'overview' | 'users' | 'questions';
export type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;
