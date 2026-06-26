'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Layers } from 'lucide-react';
import { LessonRow } from './LessonRow';
import type { CourseAccordionProps } from './types';

export function CourseAccordion({
  courseData,
  courseIndex,
  defaultOpen,
  theme,
  t
}: CourseAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const completedCount = courseData.lessons.filter((lesson) => lesson.status === 'completed').length;
  const totalCount = courseData.lessons.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: courseIndex * 0.06 }}
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: theme.modalBorder }}
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="w-full flex items-center gap-4 p-4 text-left transition-colors hover:opacity-90"
        style={{ backgroundColor: theme.cardBg }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `color-mix(in srgb, ${theme.primaryColor} 8.2%, transparent)` }}>
          <Layers className="w-5 h-5" style={{ color: theme.primaryColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: theme.textColor }}>
            {courseData.course_title ?? t('users.modals.stats.lessons.untitledCourse')}
          </p>
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.mutedTextColor }}>
            {completedCount}/{totalCount} {t('users.modals.stats.timeline.lessons')}
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform" style={{ backgroundColor: `color-mix(in srgb, ${theme.textColor} 3.1%, transparent)`, transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <ChevronDown className="w-4 h-4" style={{ color: theme.mutedTextColor }} />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open ? <CourseLessonsList courseData={courseData} theme={theme} t={t} /> : null}
      </AnimatePresence>
    </motion.div>
  );
}

function CourseLessonsList({
  courseData,
  theme,
  t
}: Pick<CourseAccordionProps, 'courseData' | 'theme' | 't'>) {
  return (
    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
      <div className="p-3 space-y-2 border-t" style={{ backgroundColor: theme.isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)', borderColor: theme.modalBorder }}>
        {courseData.lessons.length === 0 ? (
          <p className="text-center py-4 text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: theme.textColor }}>
            {t('users.modals.stats.lessons.noLessons')}
          </p>
        ) : (
          courseData.lessons.map((lesson, index) => (
            <LessonRow key={`${lesson.lesson_id}-${index}`} lesson={lesson} index={index} theme={theme} t={t} />
          ))
        )}
      </div>
    </motion.div>
  );
}
