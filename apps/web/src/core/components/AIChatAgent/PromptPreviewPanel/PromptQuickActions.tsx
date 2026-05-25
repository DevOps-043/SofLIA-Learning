import type React from 'react';
import { Check, Copy, Download, Edit3 } from 'lucide-react';

interface PromptQuickActionsProps {
  copied: boolean;
  onCopy: () => void;
  onDownload: () => void;
  onEditToggle: () => void;
}

export function PromptQuickActions({
  copied,
  onCopy,
  onDownload,
  onEditToggle
}: PromptQuickActionsProps) {
  return (
    <div className="flex gap-2">
      <PromptActionButton onClick={onCopy}>
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {copied ? 'Copiado' : 'Copiar'}
      </PromptActionButton>
      <PromptActionButton onClick={onDownload}>
        <Download className="w-4 h-4" />
        Descargar
      </PromptActionButton>
      <button
        onClick={onEditToggle}
        className="flex items-center justify-center px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
      >
        <Edit3 className="w-4 h-4" />
      </button>
    </div>
  );
}

function PromptActionButton({
  children,
  onClick
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
    >
      {children}
    </button>
  );
}
