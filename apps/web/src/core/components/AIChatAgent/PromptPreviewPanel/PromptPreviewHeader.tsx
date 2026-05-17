import { Sparkles, X } from 'lucide-react';

interface PromptPreviewHeaderProps {
  onClose: () => void;
}

export function PromptPreviewHeader({ onClose }: PromptPreviewHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-500 to-indigo-500">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-white" />
        <h3 className="text-lg font-semibold text-white">
          Vista Previa del Prompt
        </h3>
      </div>
      <button
        onClick={onClose}
        className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
