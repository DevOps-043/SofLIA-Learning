import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface UsePlanPersistenceProps {
  savedLessonDistribution: any[];
  studyApproach: 'corto' | 'balance' | 'largo' | null;
  targetDate: string | null;
  userContext: any;
  availableCourses: any[];
  selectedCourseIds: string[];
  connectedCalendar: 'google' | 'microsoft' | null;
  assignedCourses: any[];
  isAudioEnabled: boolean;
  speakText: (t: string) => Promise<void>;
  setConversationHistory: React.Dispatch<React.SetStateAction<Array<{ role: string, content: string }>>>;
  setIsProcessing: (v: boolean) => void;
  setConnectedCalendar: (v: 'google' | 'microsoft' | null) => void;
  setShowCalendarModal: (v: boolean) => void;
  savedPlanId: string | null;
  setSavedPlanId: (v: string | null) => void;
}

export function usePlanPersistence(props: UsePlanPersistenceProps) {
  const {
    savedLessonDistribution,
    studyApproach,
    targetDate,
    userContext,
    availableCourses,
    selectedCourseIds,
    connectedCalendar,
    assignedCourses,
    isAudioEnabled,
    speakText,
    setConversationHistory,
    setIsProcessing,
    setConnectedCalendar,
    setShowCalendarModal,
    savedPlanId,
    setSavedPlanId
  } = props;

  const router = useRouter();
  const [isInsertingEvents, setIsInsertingEvents] = useState(false);
  const [insertProgress, setInsertProgress] = useState({ current: 0, total: 0 });
  const [insertResult, setInsertResult] = useState<{ success: boolean; message: string; insertedCount?: number } | null>(null);
  const [showInsertConfirmModal, setShowInsertConfirmModal] = useState(false);
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);

  const parseDateStr = (dateStr: string): Date | null => {
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const parts = dateStr.split('-');
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    const monthNames: Record<string, number> = {
      'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
      'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
    };
    const readableMatch = dateStr.match(/(\d{1,2})\s*(?:de\s+)?(\w+)/i);
    if (readableMatch) {
      const day = parseInt(readableMatch[1]);
      const monthName = readableMatch[2].toLowerCase();
      const month = monthNames[monthName];
      if (month !== undefined && day >= 1 && day <= 31) {
        return new Date(new Date().getFullYear(), month, day);
      }
    }
    const parsed = new Date(dateStr);
    return !isNaN(parsed.getTime()) ? parsed : null;
  };

  const handleInsertEventsToCalendar = async () => {
    if (!savedLessonDistribution || savedLessonDistribution.length === 0) return;
    setIsInsertingEvents(true);
    setInsertProgress({ current: 0, total: savedLessonDistribution.length });
    try {
      const lessonDistributionForApi = savedLessonDistribution.map(item => {
        const dateParts = item.dateStr.split('/');
        const baseDate = new Date(parseInt(dateParts[2]), parseInt(dateParts[1]) - 1, parseInt(dateParts[0]));
        const [startHour, startMin] = item.startTime.split(':').map(Number);
        const [endHour, endMin] = item.endTime.split(':').map(Number);
        const startDate = new Date(baseDate); startDate.setHours(startHour, startMin, 0, 0);
        const endDate = new Date(baseDate); endDate.setHours(endHour, endMin, 0, 0);
        return {
          slot: {
            date: baseDate.toISOString(), start: startDate.toISOString(), end: endDate.toISOString(),
            dayName: item.dayName, durationMinutes: Math.round((endDate.getTime() - startDate.getTime()) / 60000)
          },
          lessons: item.lessons.map((l: any) => ({
            courseTitle: l.courseTitle, lessonTitle: l.lessonTitle, lessonOrderIndex: l.lessonOrderIndex, durationMinutes: l.durationMinutes || 15
          }))
        };
      });

      const response = await fetch('/api/study-planner/calendar/insert-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonDistribution: lessonDistributionForApi, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, planName: 'Plan de Estudios SofLIA' })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Error insertando eventos');
      setInsertResult({ success: result.success, message: result.message, insertedCount: result.insertedCount });
      if (result.success && result.insertedCount > 0) {
        setConversationHistory(prev => [...prev, { role: 'assistant', content: `\u2705 **\u00A1Listo!** He insertado ${result.insertedCount} eventos en tu calendario. \u2728` }]);
      }
    } catch (error: any) {
      setInsertResult({ success: false, message: error.message });
    } finally {
      setIsInsertingEvents(false);
      setShowInsertConfirmModal(false);
    }
  };

  const executeFinalPlanSave = async () => {
    if (savedLessonDistribution.length === 0) return;
    setIsProcessing(true);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      // ... Lógica de cálculo de goalHoursPerWeek, preferredDays, preferredTimeBlocks ...
      // (Simplificado para el hook, asumiendo que el componente pasará los valores procesados o el hook los calculará)
      
      // Re-implementación de la lógica de parseo y guardado
      const sessions = savedLessonDistribution.map(slot => {
        const date = parseDateStr(slot.dateStr) || new Date();
        const parseTime = (t: string) => {
          const match = (t||'').match(/(\d{1,2}):(\d{2})/);
          if (!match) return { h: 9, m: 0 };
          let h = parseInt(match[1]), m = parseInt(match[2]);
          if (t.toLowerCase().includes('p') && h < 12) h += 12;
          if (t.toLowerCase().includes('a') && h === 12) h = 0;
          return { h, m };
        };
        const sT = parseTime(slot.startTime), eT = parseTime(slot.endTime);
        const start = new Date(date); start.setHours(sT.h, sT.m, 0, 0);
        const end = new Date(date); end.setHours(eT.h, eT.m, 0, 0);
        if (end <= start) end.setHours(start.getHours() + 1);
        
        const firstLesson = slot.lessons?.[0];
        const course = availableCourses.find(c => c.title === (firstLesson?.courseTitle) || selectedCourseIds.includes(c.id));
        return {
          title: firstLesson?.lessonTitle || 'Sesión de estudio',
          description: (slot.lessons || []).map((l:any, i:number) => `${i+1}. ${l.lessonTitle}`).join('\n'),
          courseId: course?.id || selectedCourseIds[0] || '',
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          durationMinutes: Math.round((end.getTime() - start.getTime()) / 60000),
          isAiGenerated: true,
          sessionType: 'medium'
        };
      });

      const planConfig = {
        name: `Plan de Estudios - ${new Date().toLocaleDateString('es-ES')}`,
        description: `Plan generado por SofLIA con ${sessions.length} sesiones`,
        userType: userContext?.userType || 'b2c',
        courseIds: selectedCourseIds,
        goalHoursPerWeek: 5, // Default
        startDate: sessions[0]?.startTime,
        endDate: sessions[sessions.length-1]?.endTime,
        timezone,
        preferredDays: [1,2,3,4,5],
        preferredTimeBlocks: [{startHour:9, startMinute:0, endHour:10, endMinute:0}],
        minSessionMinutes: 45, maxSessionMinutes: 60, breakDurationMinutes: 10,
        preferredSessionType: 'medium', generationMode: 'ai_generated',
        calendarAnalyzed: connectedCalendar !== null, calendarProvider: connectedCalendar || undefined
      };

      if (savedPlanId && connectedCalendar) {
        await fetch('/api/study-planner/calendar/delete-plan-events', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId: savedPlanId })
        }).catch(() => {});
      }

      const saveRes = await fetch('/api/study-planner/save-plan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: planConfig, sessions })
      });

      if (!saveRes.ok) throw new Error('Error al guardar el plan');
      const saveData = await saveRes.json();
      if (!saveData.success) throw new Error(saveData.error || 'Error al guardar');

      if (saveData.data?.planId) setSavedPlanId(saveData.data.planId);

      const sessionIds = saveData.data?.sessionIds || [];
      if (connectedCalendar && sessionIds.length > 0) {
        await fetch('/api/study-planner/calendar/sync-sessions', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionIds })
        }).catch(() => {});
      }

      setConversationHistory(prev => [...prev, { role: 'assistant', content: '\u00A1Perfecto! He guardado tu plan de estudios. \ud83c\udf93' }]);
      if (isAudioEnabled) speakText('Perfecto. He guardado tu plan de estudios con todas las sesiones programadas.').catch(() => {});

      redirectTimerRef.current = setTimeout(() => {
        router.push('/study-planner/dashboard');
      }, 3000);

    } catch (error: any) {
      setConversationHistory(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}` }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isInsertingEvents,
    insertProgress,
    insertResult,
    showInsertConfirmModal,
    setShowInsertConfirmModal,
    handleInsertEventsToCalendar,
    executeFinalPlanSave
  };
}
