import type { CourseLessonContext } from '../../../../core/types/lia.types';

export interface CourseLiaColors {
  panelBg?: string;
  borderColor?: string;
  accentColor?: string;
  textPrimary?: string;
  textSecondary?: string;
}

export interface CourseLiaProps {
  lessonId?: string;
  lessonTitle?: string;
  courseSlug?: string;
  transcriptContent?: string | null;
  summaryContent?: string | null;
  lessonContent?: string | null;
  lessonContext?: CourseLessonContext;
  customColors?: CourseLiaColors;
  onSaveNote?: (content: string) => void;
}

export interface CourseLiaThemeColors {
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
  primaryAction: string;
}
