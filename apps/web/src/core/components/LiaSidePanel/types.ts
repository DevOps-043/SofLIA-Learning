import React from 'react';
import type { LiaImageAttachment } from '../../reporting/report-problem.contract';

export interface LiaThemeColors {
  panelBg: string;
  headerBg: string;
  borderColor: string;
  messageBubbleAssistant: string;
  messageBubbleUser: string;
  textPrimary: string;
  textSecondary: string;
  inputBg: string;
  inputBorder: string;
  accentColor: string;
}

export interface LiaConversationItem {
  conversation_id: string;
  conversation_title: string | null;
  started_at: string;
  total_messages?: number | string;
}

export interface LiaConversationToDelete {
  id: string;
  title: string;
}

export interface LiaQuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  prompt: string;
}

export interface LiaMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: LiaImageAttachment[];
}
