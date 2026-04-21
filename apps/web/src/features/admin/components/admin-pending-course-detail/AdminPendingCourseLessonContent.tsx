import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircleIcon,
  ChevronLeftIcon,
  DocumentTextIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/outline';
import type { PendingCourseActivity, PendingCourseLesson, PendingCourseMaterial, PendingCourseModule } from './types';
import { parseMaterialContent, resolveVideoEmbedUrl } from './utils';
import { useMediaPlaybackPolicy } from '@/core/hooks/useMediaPlaybackPolicy';

type LessonTab = 'summary' | 'transcript' | 'activities' | 'materials';

interface QuizQuestion {
  correct_answer?: number | string;
  correctAnswer?: number | string;
  explanation?: string;
  id?: string | number;
  options?: string[];
  question?: string;
}

interface ScriptScene {
  character?: string;
  emotion?: string;
  message?: string;
}

interface QuizData {
  items?: QuizQuestion[];
  passing_score?: number;
  questions?: QuizQuestion[];
}

interface ScriptData {
  conclusion?: string;
  introduction?: string;
  scenes?: ScriptScene[];
}

function VideoPlayer({ provider, providerId }: { provider: string; providerId: string }) {
  const [hasActivatedEmbed, setHasActivatedEmbed] = useState(false);
  const playbackPolicy = useMediaPlaybackPolicy('preview');
  const { t } = useTranslation('common');
  const embedUrl = resolveVideoEmbedUrl(provider, providerId);

  if (!providerId) {
    return <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-500">Video no disponible</div>;
  }

  if (embedUrl && (provider === 'youtube' || provider === 'vimeo')) {
    if (playbackPolicy.shouldUseEmbedFacade && !hasActivatedEmbed) {
      return (
        <button
          type="button"
          className="flex h-full w-full items-center justify-center bg-gray-900 text-white"
          onClick={() => setHasActivatedEmbed(true)}
        >
          <span className="flex flex-col items-center gap-2">
            <PlayCircleIcon className="h-12 w-12" />
            <span className="text-sm font-medium">{t('media.tapToPlay')}</span>
          </span>
        </button>
      );
    }

    return (
      <iframe
        src={embedUrl}
        className="w-full h-full"
        frameBorder="0"
        allow={
          playbackPolicy.allowIframeAutoplay
            ? 'autoplay; fullscreen; picture-in-picture'
            : 'fullscreen; picture-in-picture'
        }
        allowFullScreen
        loading="lazy"
      />
    );
  }

  return (
    <video
      src={providerId}
      className="w-full h-full object-contain"
      controls
      controlsList="nodownload"
      playsInline
      preload={playbackPolicy.nativeVideoPreload}
    />
  );
}

function QuizViewer({ data }: { data: QuizData | null }) {
  const questions = data?.questions || data?.items;
  if (!data || !questions) {
    return <p className="text-gray-400 italic">Datos de Quiz inválidos</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center text-xs text-gray-500 border-b border-gray-200 dark:border-gray-700 pb-2">
        <span>Passing Score: {data.passing_score}%</span>
        <span>{questions.length} Preguntas</span>
      </div>

      {questions.map((item, index) => (
        <div
          key={item.id || index}
          className="bg-white dark:bg-gray-900/50 p-3 rounded border border-gray-100 dark:border-gray-800"
        >
          <p className="font-medium text-gray-800 dark:text-gray-200 mb-2">
            {index + 1}. {item.question}
          </p>
          <div className="space-y-1 pl-2">
            {item.options?.map((option, optionIndex) => {
              const correctAnswer = item.correct_answer !== undefined ? item.correct_answer : item.correctAnswer;
              const isCorrect =
                (typeof correctAnswer === 'number' && correctAnswer === optionIndex) || correctAnswer === option;

              return (
                <div
                  key={optionIndex}
                  className={`flex items-center gap-2 text-xs ${
                    isCorrect
                      ? 'text-green-600 dark:text-green-400 font-medium'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {isCorrect ? (
                    <CheckCircleIcon className="h-4 w-4" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-gray-300 dark:border-gray-600" />
                  )}
                  <span>{option}</span>
                </div>
              );
            })}
          </div>
          {item.explanation && (
            <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10 p-2 rounded">
              <span className="font-bold">Explicación:</span> {item.explanation}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ScriptViewer({ data }: { data: ScriptData | null }) {
  if (!data?.scenes) {
    return <p className="text-gray-400 italic">Datos de Script inválidos</p>;
  }

  return (
    <div className="space-y-4">
      {data.introduction && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-sm text-blue-800 dark:text-blue-200 italic mb-4">
          "{data.introduction}"
        </div>
      )}

      <div className="space-y-3">
        {data.scenes.map((scene, index) => (
          <div key={index} className={`flex gap-3 ${scene.character === 'Usuario' ? 'flex-row-reverse' : ''}`}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                scene.character === 'Lia' ? 'bg-purple-500' : 'bg-gray-500'
              }`}
            >
              {scene.character?.[0] || '?'}
            </div>
            <div
              className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                scene.character === 'Usuario'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 rounded-tr-none'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-xs opacity-70">{scene.character}</span>
                {scene.emotion && (
                  <span className="text-[10px] uppercase tracking-wide opacity-50 border border-current px-1 rounded">
                    {scene.emotion}
                  </span>
                )}
              </div>
              <p>{scene.message}</p>
            </div>
          </div>
        ))}
      </div>

      {data.conclusion && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded border-l-4 border-green-500 text-sm text-green-900 dark:text-green-100">
          <span className="font-bold">Conclusión:</span> {data.conclusion}
        </div>
      )}
    </div>
  );
}

function ActivityItem({ activity }: { activity: PendingCourseActivity }) {
  const { error, parsedContent } = parseMaterialContent(activity.activity_content);

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
              activity.activity_type === 'quiz'
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                : activity.activity_type === 'ai_chat' || activity.activity_type === 'lia_script'
                  ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
            }`}
          >
            {activity.activity_type}
          </span>
          <h5 className="font-semibold text-sm text-gray-800 dark:text-gray-200">{activity.activity_title}</h5>
        </div>
      </div>

      <div className="p-4">
        {error ? (
          <div className="text-red-500 text-xs font-mono p-2 bg-red-50 dark:bg-red-900/20 rounded">
            {error}. Raw: {String(activity.activity_content).substring(0, 100)}...
          </div>
        ) : (
          <div className="text-sm">
            {activity.activity_type === 'quiz' && <QuizViewer data={parsedContent as QuizData | null} />}
            {(activity.activity_type === 'lia_script' || activity.activity_type === 'ai_chat') && (
              <ScriptViewer data={parsedContent as ScriptData | null} />
            )}
            {activity.activity_type !== 'quiz' &&
              activity.activity_type !== 'lia_script' &&
              activity.activity_type !== 'ai_chat' && (
                <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-x-auto">
                  {JSON.stringify(parsedContent, null, 2)}
                </pre>
              )}
          </div>
        )}
      </div>
    </div>
  );
}

function MaterialItem({ material }: { material: PendingCourseMaterial }) {
  if (!material.material_type || (material.material_type !== 'quiz' && material.material_type !== 'interactive')) {
    return (
      <a
        href={material.file_url || material.external_url || '#'}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 transition-colors group"
      >
        <DocumentTextIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-500" />
        <span className="text-sm text-gray-700 dark:text-gray-200">{material.material_title}</span>
        <span className="text-xs ml-auto text-gray-400 uppercase">{material.material_type || 'archivo'}</span>
      </a>
    );
  }

  const { error, parsedContent } = parseMaterialContent(material.content_data);

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
              material.material_type === 'quiz'
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
            }`}
          >
            {material.material_type}
          </span>
          <h5 className="font-semibold text-sm text-gray-800 dark:text-gray-200">{material.material_title}</h5>
        </div>
      </div>

      <div className="p-4">
        {error ? (
          <div className="text-red-500 text-xs font-mono p-2 bg-red-50 dark:bg-red-900/20 rounded">{error}</div>
        ) : (
          <div className="text-sm">{material.material_type === 'quiz' && <QuizViewer data={parsedContent as QuizData | null} />}</div>
        )}
      </div>
    </div>
  );
}

export function AdminPendingCourseLessonDetails({ lesson }: { lesson: PendingCourseLesson }) {
  const [activeTab, setActiveTab] = useState<LessonTab>('summary');

  return (
    <>
      <div className="mb-6 bg-black rounded-lg overflow-hidden aspect-video max-w-2xl mx-auto">
        <VideoPlayer provider={lesson.video_provider} providerId={lesson.video_provider_id} />
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
        <button onClick={() => setActiveTab('summary')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'summary' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Resumen</button>
        <button onClick={() => setActiveTab('transcript')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'transcript' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Transcripción</button>
        <button onClick={() => setActiveTab('activities')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'activities' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Actividades ({lesson.activities?.length || 0})</button>
        <button onClick={() => setActiveTab('materials')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'materials' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Materiales ({lesson.materials?.length || 0})</button>
      </div>

      <div className="bg-white dark:bg-[#1E2329] p-4 rounded-lg border border-gray-200 dark:border-gray-700 min-h-[150px]">
        {activeTab === 'summary' && (
          <div className="prose dark:prose-invert max-w-none text-sm">
            {lesson.summary_content ? lesson.summary_content : <p className="text-gray-400 italic">No hay resumen disponible.</p>}
          </div>
        )}
        {activeTab === 'transcript' && (
          <div className="h-64 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-900 rounded text-sm font-mono text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
            {lesson.transcript_content || 'No hay transcripción disponible.'}
          </div>
        )}
        {activeTab === 'activities' && (
          <div className="space-y-4">
            {lesson.activities?.length ? lesson.activities.map((activity) => <ActivityItem key={activity.activity_id} activity={activity} />) : <p className="text-gray-400 italic">No hay actividades creadas.</p>}
          </div>
        )}
        {activeTab === 'materials' && (
          <div className="space-y-2">
            {lesson.materials?.length ? lesson.materials.map((material) => <MaterialItem key={material.material_id} material={material} />) : <p className="text-gray-400 italic">No hay materiales adicionales.</p>}
          </div>
        )}
      </div>
    </>
  );
}

function LessonItem({ lesson }: { lesson: PendingCourseLesson }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useTranslation('admin');

  return (
    <div className="border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer flex items-center gap-3"
      >
        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
          <PlayCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">{lesson.lesson_title}</h4>
          <p className="text-xs text-gray-500">
            {lesson.duration_seconds} seg • {lesson.video_provider}
          </p>
        </div>
        <div className="flex gap-2 mr-4">
          {lesson.transcript_content && <span title={t('lessonContent.transcript')} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-500">T</span>}
          {lesson.summary_content && <span title={t('lessonContent.summary')} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-500">R</span>}
          {lesson.activities?.length ? <span title={t('lessonContent.activities')} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-500">A:{lesson.activities.length}</span> : null}
        </div>
        <ChevronLeftIcon className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? '-rotate-90' : 'rotate-180'}`} />
      </div>

      {isExpanded && (
        <div className="bg-gray-50 dark:bg-gray-800/30 p-4 border-t border-gray-100 dark:border-gray-800">
          <AdminPendingCourseLessonDetails lesson={lesson} />
        </div>
      )}
    </div>
  );
}

export function AdminPendingCourseLessonContent({ modules }: { modules?: PendingCourseModule[] }) {
  return (
    <div className="space-y-4 mb-8">
      {modules?.map((module) => (
        <div key={module.module_id} className="bg-white dark:bg-[#1E2329] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">
              Módulo {module.module_order_index}: {module.module_title}
            </h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {module.lessons?.map((lesson) => (
              <LessonItem key={lesson.lesson_id} lesson={lesson} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
