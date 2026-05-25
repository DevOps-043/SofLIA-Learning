import { QuizBuilder } from '../QuizBuilder'
import type { ActivityEditorState } from './use-activity-editor-state'
import { AiPromptsEditor } from './ai-prompts-editor'
import { ReadingActivityEditor } from './reading-activity-editor'
import { labelTextClassName, textareaClassName } from './styles'

export function ContentTab({ state }: { state: ActivityEditorState }) {
  const { form, setAiPrompts, setForm, setQuizQuestions } = state

  return (
    <div className="space-y-4">
      {form.activity_type === 'reading' ? (
        <ReadingActivityEditor
          value={form.activity_content}
          estimatedMinutes={form.estimated_time_minutes}
          onChange={(activityContent, estimatedTimeMinutes) =>
            setForm((current) => ({
              ...current,
              activity_content: activityContent,
              estimated_time_minutes: estimatedTimeMinutes,
            }))
          }
        />
      ) : null}
      {form.activity_type !== 'quiz' && form.activity_type !== 'reading' ? (
        <label className="space-y-2">
          <span className={labelTextClassName}>Contenido renderizado</span>
          <textarea
            rows={10}
            value={form.activity_content}
            onChange={(event) => setForm((current) => ({ ...current, activity_content: event.target.value }))}
            className={textareaClassName}
            placeholder="Instrucciones, contexto y texto rico de la actividad."
          />
        </label>
      ) : null}
      {form.activity_type === 'quiz' ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-white/70">
            El quiz se guarda como JSON estructurado en `activity_content`.
          </p>
          <QuizBuilder questions={state.quizQuestions} onChange={setQuizQuestions} />
        </div>
      ) : null}
      {form.activity_type === 'ai_chat' ? (
        <AiPromptsEditor prompts={state.aiPrompts} setPrompts={setAiPrompts} />
      ) : null}
    </div>
  )
}
