import { Settings, X } from 'lucide-react';

export function ModalHeader(props: { onClose: () => void; title: string }) {
  return (
    <div className="flex items-center justify-between p-6 border-b border-[#E9ECEF] dark:border-[#6C757D]/30">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-[#0A2540] dark:text-[#00D4B3]" />
        <h2 className="text-2xl font-bold text-[#0A2540] dark:text-white">
          {props.title}
        </h2>
      </div>
      <button
        onClick={props.onClose}
        className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
      >
        <X className="w-5 h-5 text-[#6C757D] dark:text-gray-400" />
      </button>
    </div>
  );
}
