import type { LessonFormData } from './types';

interface LessonContentTextAreaProps {
  field: 'summary_content' | 'transcript_content';
  formData: LessonFormData;
  helpText?: string;
  label: string;
  onFormDataChange: (updater: (currentFormData: LessonFormData) => LessonFormData) => void;
  placeholder: string;
}

export function LessonContentTextArea({
  field,
  formData,
  helpText,
  label,
  onFormDataChange,
  placeholder,
}: LessonContentTextAreaProps) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 dark:text-white/70 mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      <textarea
        rows={4}
        value={formData[field]}
        onChange={(event) => onFormDataChange((current) => ({ ...current, [field]: event.target.value }))}
        className="w-full px-4 py-2.5 bg-white dark:bg-carbon-950 border border-gray-200 dark:border-gray-500/30 rounded-xl text-primary dark:text-white placeholder-gray-500 dark:placeholder-white/60 focus:ring-2 focus:ring-accent/40 focus:border-transparent transition-all duration-200 resize-none"
        placeholder={placeholder}
      />
      {helpText && <p className="mt-1 text-xs text-gray-500 dark:text-white/60">{helpText}</p>}
    </div>
  );
}
