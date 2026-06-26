import { Settings, X } from 'lucide-react';

const ORG_ACCENT = 'var(--org-accent-color, var(--color-accent))';

export function ModalHeader(props: { onClose: () => void; title: string }) {
  return (
    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-500/30">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-primary dark:text-white" style={{ color: ORG_ACCENT }} />
        <h2 className="text-2xl font-bold text-primary dark:text-white">
          {props.title}
        </h2>
      </div>
      <button
        onClick={props.onClose}
        className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
      >
        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
      </button>
    </div>
  );
}
