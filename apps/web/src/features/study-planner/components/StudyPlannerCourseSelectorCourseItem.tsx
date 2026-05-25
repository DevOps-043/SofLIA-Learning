'use client';

import { motion } from 'framer-motion';
import type { StudyPlannerCourseOption } from '../types/planner-ui.types';

export function StudyPlannerCourseSelectorCourseItem({
  course,
  index,
  isSelected,
  onToggleCourse,
}: {
  course: StudyPlannerCourseOption;
  index: number;
  isSelected: boolean;
  onToggleCourse: (courseId: string) => void;
}) {
  return (
    <motion.div
      key={course.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <motion.button
        onClick={() => onToggleCourse(course.id)}
        whileHover={{ scale: 1.02, x: 4 }}
        whileTap={{ scale: 0.98 }}
        className={`group relative flex w-full items-center gap-4 overflow-hidden rounded-xl border-2 p-4 transition-all ${
          isSelected
            ? 'border-primary/30 bg-primary/10 shadow-sm dark:border-accent/30 dark:bg-primary/20'
            : 'border-gray-200 bg-gray-200/30 hover:border-primary/50 hover:bg-gray-200/50 dark:border-gray-500/30 dark:bg-primary/5 dark:hover:border-accent/50 dark:hover:bg-primary/10'
        }`}
      >
        {!isSelected && (
          <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]" />
        )}

        <motion.div
          className={`relative flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-all ${
            isSelected
              ? 'bg-primary shadow-sm dark:bg-primary'
              : 'border-2 border-gray-500/30 bg-gray-200 dark:bg-gray-500'
          }`}
          animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="h-3 w-3 rounded-full bg-white"
            />
          )}
        </motion.div>

        <div className="min-w-0 flex-1 text-left">
          <p
            className={`mb-1 line-clamp-2 text-sm font-semibold ${
              isSelected ? 'text-primary dark:text-white' : 'text-primary dark:text-gray-200'
            }`}
          >
            {course.title}
          </p>
          {course.organizationName && (
            <p className="mb-1 text-xs font-medium text-accent dark:text-accent">
              {course.organizationName}
            </p>
          )}
          {course.progress > 0 && (
            <div className="mt-1 flex items-center gap-2">
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-500/30">
                <motion.div
                  className="h-full bg-primary dark:bg-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${course.progress}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                />
              </div>
              <span
                className={`text-xs font-medium ${
                  isSelected ? 'text-primary dark:text-accent' : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {course.progress}% completado
              </span>
            </div>
          )}
        </div>

        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="h-2 w-2 rounded-full bg-success shadow-lg shadow-success/50"
          />
        )}
      </motion.button>
    </motion.div>
  );
}
