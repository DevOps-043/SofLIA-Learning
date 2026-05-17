import { Plus, Trash2 } from 'lucide-react'

import { iconButtonClassName, panelClassName, smallButtonClassName, textareaClassName } from './styles'

interface AiPromptsEditorProps {
  prompts: string[]
  setPrompts: React.Dispatch<React.SetStateAction<string[]>>
}

export function AiPromptsEditor({ prompts, setPrompts }: AiPromptsEditorProps) {
  return (
    <div className={`space-y-3 ${panelClassName}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-primary dark:text-white">Prompts para la actividad</p>
          <p className="text-xs text-gray-600 dark:text-white/60">Se guardan como arreglo JSON.</p>
        </div>
        <button
          type="button"
          onClick={() => setPrompts((current) => [...current, ''])}
          className={smallButtonClassName}
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar prompt
        </button>
      </div>
      {prompts.map((prompt, index) => (
        <div key={`prompt-${index}`} className="flex items-start gap-2">
          <textarea
            rows={3}
            value={prompt}
            onChange={(event) =>
              setPrompts((current) =>
                current.map((item, itemIndex) =>
                  itemIndex === index ? event.target.value : item,
                ),
              )
            }
            className={textareaClassName}
            placeholder={`Prompt ${index + 1}`}
          />
          <button
            type="button"
            onClick={() =>
              setPrompts((current) =>
                current.length === 1
                  ? ['']
                  : current.filter((_, itemIndex) => itemIndex !== index),
              )
            }
            className={iconButtonClassName}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
