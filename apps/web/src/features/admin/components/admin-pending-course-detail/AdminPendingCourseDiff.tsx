import { useState } from 'react';
import {
  ArrowsRightLeftIcon,
  EyeIcon,
  EyeSlashIcon,
  MinusCircleIcon,
  PlayCircleIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline';
import type { CourseDiff, DiffLesson, DiffModule, DiffStatus, FieldChange } from '../../../../lib/courseDiff';
import { PendingCourseLessonDetails } from './lesson-content/PendingCourseLessonDetails';
import { getFieldLabel, truncateFieldValue } from './utils';

const diffColors: Record<DiffStatus, { bg: string; text: string; border: string; label: string }> = {
  added: { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', border: 'border-green-400 dark:border-green-600', label: 'Nuevo' },
  removed: { bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', border: 'border-red-400 dark:border-red-600', label: 'Eliminado' },
  modified: { bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-400 dark:border-yellow-600', label: 'Modificado' },
  unchanged: { bg: '', text: 'text-gray-400', border: 'border-transparent', label: '' },
};

function DiffBadge({ status }: { status: DiffStatus }) {
  if (status === 'unchanged') {
    return null;
  }

  const color = diffColors[status];
  const Icon = status === 'added' ? PlusCircleIcon : status === 'removed' ? MinusCircleIcon : ArrowsRightLeftIcon;

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded ${color.bg} ${color.text}`}>
      <Icon className="h-3 w-3" />
      {color.label}
    </span>
  );
}

function FieldChangeRow({ change }: { change: FieldChange }) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="font-medium text-gray-600 dark:text-gray-400 min-w-[100px] shrink-0">
        {getFieldLabel(change.field)}:
      </span>
      <span className="line-through text-red-500 dark:text-red-400">{truncateFieldValue(change.oldValue)}</span>
      <span className="text-gray-400">→</span>
      <span className="text-green-600 dark:text-green-400 font-medium">{truncateFieldValue(change.newValue)}</span>
    </div>
  );
}

function DiffLessonItem({ diffLesson }: { diffLesson: DiffLesson }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const color = diffColors[diffLesson.status];
  const isRemoved = diffLesson.status === 'removed';
  const displayLesson = diffLesson.proposed ?? diffLesson.original;

  if (!displayLesson) {
    return null;
  }

  return (
    <div className={`border-b border-gray-100 dark:border-gray-800 last:border-0 ${isRemoved ? 'opacity-60' : ''}`}>
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer flex items-center gap-3 ${color.bg}`}
      >
        <div
          className={`p-2 rounded-lg ${
            diffLesson.status === 'added'
              ? 'bg-green-100 dark:bg-green-900/30'
              : diffLesson.status === 'removed'
                ? 'bg-red-100 dark:bg-red-900/30'
                : 'bg-blue-100 dark:bg-blue-900/30'
          }`}
        >
          <PlayCircleIcon
            className={`h-5 w-5 ${
              diffLesson.status === 'added'
                ? 'text-green-600 dark:text-green-400'
                : diffLesson.status === 'removed'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-blue-600 dark:text-blue-400'
            }`}
          />
        </div>
        <div className="flex-1">
          <h4 className={`font-medium ${isRemoved ? 'line-through text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
            {diffLesson.lesson_title}
          </h4>
          {diffLesson.original_title && (
            <p className="text-[10px] text-gray-400 italic">antes: {diffLesson.original_title}</p>
          )}
          <p className="text-xs text-gray-500">
            {displayLesson.duration_seconds} seg • {displayLesson.video_provider}
          </p>
        </div>
        <DiffBadge status={diffLesson.status} />
      </div>

      {isExpanded && !isRemoved && (
        <div className="bg-gray-50 dark:bg-gray-800/30 p-4 border-t border-gray-100 dark:border-gray-800">
          {diffLesson.changes.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 mb-1">Cambios en esta lección:</p>
              {diffLesson.changes.map((change) => (
                <FieldChangeRow key={change.field} change={change} />
              ))}
            </div>
          )}
          <PendingCourseLessonDetails lesson={displayLesson} />
        </div>
      )}
    </div>
  );
}

function DiffModuleItem({ diffModule }: { diffModule: DiffModule }) {
  const color = diffColors[diffModule.status];
  const isRemoved = diffModule.status === 'removed';

  return (
    <div className={`rounded-xl border-l-4 ${color.border} overflow-hidden ${isRemoved ? 'opacity-60' : ''}`}>
      <div className="bg-white dark:bg-carbon-800 rounded-r-xl border border-l-0 border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className={`font-semibold ${isRemoved ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
              {diffModule.module_title}
            </h3>
            <DiffBadge status={diffModule.status} />
          </div>
          {diffModule.original_title && (
            <span className="text-xs text-gray-400 italic">antes: {diffModule.original_title}</span>
          )}
        </div>

        {diffModule.changes.length > 0 && (
          <div className="px-6 py-2 bg-yellow-50/50 dark:bg-yellow-900/5 border-b border-gray-100 dark:border-gray-800">
            {diffModule.changes.map((change) => (
              <FieldChangeRow key={change.field} change={change} />
            ))}
          </div>
        )}

        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {diffModule.lessons.map((lesson, index) => (
            <DiffLessonItem key={`diff-lesson-${index}`} diffLesson={lesson} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface AdminPendingCourseDiffProps {
  diff: CourseDiff;
  showDiffView: boolean;
  onToggle: () => void;
}

export function AdminPendingCourseDiff({
  diff,
  onToggle,
  showDiffView,
}: AdminPendingCourseDiffProps) {
  const totalChanges =
    diff.summary.modulesAdded +
    diff.summary.modulesRemoved +
    diff.summary.modulesModified +
    diff.summary.lessonsAdded +
    diff.summary.lessonsRemoved +
    diff.summary.lessonsModified;

  return (
    <>
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2">
            <ArrowsRightLeftIcon className="h-5 w-5" />
            Resumen de Cambios ({totalChanges} {totalChanges === 1 ? 'cambio' : 'cambios'})
          </h3>
          <button
            onClick={onToggle}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
          >
            {showDiffView ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            {showDiffView ? 'Ver Versión Final' : 'Ver Cambios'}
          </button>
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          {diff.summary.modulesAdded > 0 && (
            <span className="flex items-center gap-1 text-green-700 dark:text-green-400">
              <PlusCircleIcon className="h-4 w-4" /> {diff.summary.modulesAdded} {diff.summary.modulesAdded === 1 ? 'módulo nuevo' : 'módulos nuevos'}
            </span>
          )}
          {diff.summary.modulesRemoved > 0 && (
            <span className="flex items-center gap-1 text-red-700 dark:text-red-400">
              <MinusCircleIcon className="h-4 w-4" /> {diff.summary.modulesRemoved} {diff.summary.modulesRemoved === 1 ? 'módulo eliminado' : 'módulos eliminados'}
            </span>
          )}
          {diff.summary.modulesModified > 0 && (
            <span className="flex items-center gap-1 text-yellow-700 dark:text-yellow-400">
              <ArrowsRightLeftIcon className="h-4 w-4" /> {diff.summary.modulesModified} {diff.summary.modulesModified === 1 ? 'módulo modificado' : 'módulos modificados'}
            </span>
          )}
          {diff.summary.lessonsAdded > 0 && (
            <span className="flex items-center gap-1 text-green-700 dark:text-green-400">
              <PlusCircleIcon className="h-4 w-4" /> {diff.summary.lessonsAdded} {diff.summary.lessonsAdded === 1 ? 'lección nueva' : 'lecciones nuevas'}
            </span>
          )}
          {diff.summary.lessonsRemoved > 0 && (
            <span className="flex items-center gap-1 text-red-700 dark:text-red-400">
              <MinusCircleIcon className="h-4 w-4" /> {diff.summary.lessonsRemoved} {diff.summary.lessonsRemoved === 1 ? 'lección eliminada' : 'lecciones eliminadas'}
            </span>
          )}
          {diff.summary.lessonsModified > 0 && (
            <span className="flex items-center gap-1 text-yellow-700 dark:text-yellow-400">
              <ArrowsRightLeftIcon className="h-4 w-4" /> {diff.summary.lessonsModified} {diff.summary.lessonsModified === 1 ? 'lección modificada' : 'lecciones modificadas'}
            </span>
          )}
          {totalChanges === 0 && <span className="text-gray-500">Sin cambios detectados en la estructura del curso.</span>}
        </div>
      </div>

      {showDiffView && diff.courseChanges.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-2 flex items-center gap-2">
            <ArrowsRightLeftIcon className="h-4 w-4" />
            Cambios en datos generales del curso
          </h3>
          <div className="space-y-1">
            {diff.courseChanges.map((change) => (
              <FieldChangeRow key={change.field} change={change} />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4 mb-8">
        {showDiffView &&
          diff.modules.map((module, index) => (
            <DiffModuleItem key={`diff-module-${index}`} diffModule={module} />
          ))}
      </div>
    </>
  );
}
