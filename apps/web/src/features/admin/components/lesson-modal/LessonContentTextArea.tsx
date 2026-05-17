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
      <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      <textarea
        rows={4}
        value={formData[field]}
        onChange={(event) => onFormDataChange((current) => ({ ...current, [field]: event.target.value }))}
        className="w-full px-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200 resize-none"
        placeholder={placeholder}
      />
      {helpText && <p className="mt-1 text-xs text-[#6C757D] dark:text-white/60">{helpText}</p>}
    </div>
  );
}
