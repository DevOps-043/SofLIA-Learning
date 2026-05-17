import type { LucideIcon } from 'lucide-react';

export type MetricCard = {
  icon: LucideIcon;
  label: string;
  value: string;
  sublabel?: string;
  gradient: string;
};

export interface ConversationWeek {
  week?: string;
  count?: number;
}

export interface ConversationTopic {
  tema: string;
  count: number;
  color: string;
}

export interface TimeSlot {
  periodo: string;
  porcentaje: number;
  color: string;
}

export type ChartRow = Record<string, string | number>;

export type StudentData = Record<string, unknown> & {
  enrollment?: { progressPercentage?: number };
  engagement?: {
    activitiesCompleted?: number;
    avgDailyTime?: number;
    lessonsViewed?: number;
    notesCreated?: number;
  };
  lia?: {
    avgMessagesPerConversation?: number;
    conversationTopics?: ConversationTopic[];
    conversationsByWeek?: ConversationWeek[];
    conversationsThisWeek?: number;
    positiveFeedbackCount?: number;
    positiveFeedbackRate?: number;
    totalConversations?: number;
    totalMessages?: number;
  };
  studySessions?: {
    activeDays?: ChartRow[];
    avgSessionDuration?: number;
    dailyStudyTime?: ChartRow[];
    lastSession?: { hoursAgo?: number };
    preferredTimeSlots?: TimeSlot[];
    studyStreak?: number;
    totalCourseStudyTime?: number;
    totalSessions?: number;
    totalStudyTime?: number;
    weeklyFrequency?: number;
    weeklyProgress?: ChartRow[];
  };
};

export interface StudentProgressSectionProps {
  studentDetailsData: Record<string, unknown>;
  selectedStudent: Record<string, unknown>;
}
