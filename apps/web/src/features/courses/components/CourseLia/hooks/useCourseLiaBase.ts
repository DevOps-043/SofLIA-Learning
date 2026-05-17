import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import { useLiaCourseChat } from '@/core/hooks/useLiaCourseChat';
import { useLanguage } from '@/core/providers/I18nProvider';
import { useThemeStore } from '@/core/stores/themeStore';
import { useLiaCourse } from '@/features/courses/context/LiaCourseContext';

import { useCourseLiaTheme } from './useCourseLiaTheme';
import { useMobileViewport } from './useMobileViewport';
import { useResolvedLessonContext } from './useResolvedLessonContext';
import type { CourseLiaProps } from '../types';

export function useCourseLiaBase(props: CourseLiaProps) {
  const { t } = useTranslation('learn');
  const { language } = useLanguage();
  const liaCourse = useLiaCourse();
  const router = useRouter();
  const { resolvedTheme } = useThemeStore();
  const isDarkMode = resolvedTheme === 'dark';
  const isLightTheme = !isDarkMode;
  const resolvedLessonContext = useResolvedLessonContext(props);
  const isMobile = useMobileViewport();
  const [inputValue, setInputValue] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const prevActivityTriggerRef = useRef<number | null>(null);
  const copyFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const theme = useCourseLiaTheme({ customColors: props.customColors, isLightTheme });
  const liaChat = useLiaCourseChat(null);

  return {
    ...liaCourse,
    ...theme,
    copiedMessageId,
    copyFeedbackTimeoutRef,
    editInputRef,
    editingMessageId,
    editingValue,
    inputRef,
    inputValue,
    isDarkMode,
    isLightTheme,
    isMobile,
    language,
    liaChat,
    messagesEndRef,
    onSaveNote: props.onSaveNote,
    panelRef,
    prevActivityTriggerRef,
    resolvedLessonContext,
    router,
    setCopiedMessageId,
    setEditingMessageId,
    setEditingValue,
    setInputValue,
    t,
  };
}
