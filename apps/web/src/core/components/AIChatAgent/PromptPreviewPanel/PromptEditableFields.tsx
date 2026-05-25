import type { PromptDraftEditorProps } from './types';

export function PromptEditableFields({
  draft,
  isEditing,
  editedDraft,
  onEditedDraftChange
}: PromptDraftEditorProps) {
  return (
    <>
      <EditableTextField
        label="Titulo"
        value={draft.title || 'Sin titulo'}
        editValue={editedDraft.title}
        isEditing={isEditing}
        onChange={(title) => onEditedDraftChange({ ...editedDraft, title })}
      />
      <EditableTextArea
        label="Descripcion"
        value={draft.description || 'Sin descripcion'}
        editValue={editedDraft.description}
        isEditing={isEditing}
        rows={3}
        onChange={(description) => onEditedDraftChange({ ...editedDraft, description })}
      />
      <EditableTextArea
        label="Contenido del Prompt"
        value={draft.content || 'Sin contenido'}
        editValue={editedDraft.content}
        isEditing={isEditing}
        rows={8}
        monospace
        onChange={(content) => onEditedDraftChange({ ...editedDraft, content })}
      />
    </>
  );
}

function FieldLabel({ label }: { label: string }) {
  return (
    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
      {label}
    </label>
  );
}

function EditableTextField(props: EditableFieldProps) {
  return (
    <div>
      <FieldLabel label={props.label} />
      {props.isEditing ? (
        <input
          type="text"
          value={props.editValue}
          onChange={(event) => props.onChange(event.target.value)}
          className="w-full mt-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
        />
      ) : (
        <h4 className="mt-1 font-semibold text-gray-900 dark:text-white">{props.value}</h4>
      )}
    </div>
  );
}

function EditableTextArea(props: EditableFieldProps & { rows: number; monospace?: boolean }) {
  return (
    <div>
      <FieldLabel label={props.label} />
      {props.isEditing ? (
        <textarea
          value={props.editValue}
          onChange={(event) => props.onChange(event.target.value)}
          className={`w-full mt-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm ${props.monospace ? 'font-mono' : ''}`}
          rows={props.rows}
        />
      ) : (
        <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className={`text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap ${props.monospace ? 'font-mono' : ''}`}>
            {props.value}
          </p>
        </div>
      )}
    </div>
  );
}

interface EditableFieldProps {
  label: string;
  value: string;
  editValue: string;
  isEditing: boolean;
  onChange: (value: string) => void;
}
