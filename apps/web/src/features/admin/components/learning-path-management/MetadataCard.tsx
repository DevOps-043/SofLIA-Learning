import type { LearningPath, LpTranslator, SaveMetadata, SetLearningPath } from './types'

interface MetadataCardProps {
  learningPath: LearningPath
  lp: LpTranslator
  saving: boolean
  setLearningPath: SetLearningPath
  onSave: SaveMetadata
}

export function MetadataCard({ learningPath, lp, saving, setLearningPath, onSave }: MetadataCardProps) {
  const updateField = (field: 'title' | 'slug' | 'description', value: string) => {
    setLearningPath(current => current ? { ...current, [field]: value } : current)
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-800">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{lp('metadata', 'Metadatos')}</h2>
      <div className="mt-4 space-y-4">
        <MetadataInput label={lp('titleLabel', 'Titulo')} value={learningPath.title} onChange={value => updateField('title', value)} />
        <MetadataInput label={lp('slugLabel', 'Slug')} value={learningPath.slug || ''} onChange={value => updateField('slug', value)} />
        <label className="block space-y-2">
          <span className="text-sm font-medium text-gray-700 dark:text-white/80">{lp('descriptionLabel', 'Descripcion')}</span>
          <textarea
            value={learningPath.description || ''}
            onChange={event => updateField('description', event.target.value)}
            className="min-h-32 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-accent)] dark:border-white/10 dark:bg-gray-900 dark:text-white"
          />
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={saving}
            onClick={() => void onSave({ title: learningPath.title, slug: learningPath.slug, description: learningPath.description, is_active: learningPath.is_active })}
            className="w-full rounded-2xl bg-[var(--color-accent)] px-4 py-3 text-center text-sm font-semibold text-[var(--color-primary)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-1"
          >
            {saving ? lp('saving', 'Guardando...') : lp('saveMetadata', 'Guardar metadatos')}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void onSave({ is_active: !learningPath.is_active })}
            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/5 sm:w-auto"
          >
            {learningPath.is_active ? lp('deactivate', 'Desactivar') : lp('activate', 'Activar')}
          </button>
        </div>
      </div>
    </div>
  )
}

function MetadataInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-gray-700 dark:text-white/80">{label}</span>
      <input value={value} onChange={event => onChange(event.target.value)} className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-accent)] dark:border-white/10 dark:bg-gray-900 dark:text-white" />
    </label>
  )
}
