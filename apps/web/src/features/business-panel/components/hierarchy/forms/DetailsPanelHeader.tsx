import { Edit2, X } from 'lucide-react';
import type { DetailsPanelType } from './details-panel.types';
import { detailsPanelColorClasses } from './details-panel.types';

interface DetailsPanelHeaderProps {
  code?: string | null;
  isActive: boolean;
  name: string;
  onClose: () => void;
  onEdit?: () => void;
  statusLabels: {
    active: string;
    inactive: string;
  };
  type: DetailsPanelType;
  typeLabel: string;
}

export function DetailsPanelHeader({
  code,
  isActive,
  name,
  onClose,
  onEdit,
  statusLabels,
  type,
  typeLabel,
}: DetailsPanelHeaderProps) {
  return (
    <div className={`${detailsPanelColorClasses[type]} p-5`}>
      <div className="flex items-center justify-between">
        <span className="text-white/80 text-sm font-medium uppercase tracking-wide">{typeLabel}</span>
        <div className="flex items-center gap-2">
          {onEdit && (
            <button onClick={onEdit} className="p-1.5 hover:bg-white/20 rounded text-white" title="Editar">
              <Edit2 className="w-5 h-5" />
            </button>
          )}
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      <h3 className="text-2xl font-bold text-white mt-2">{name}</h3>
      <div className="flex items-center gap-2 mt-2">
        {code && <span className="px-2 py-0.5 bg-white/20 text-white text-xs rounded">{code}</span>}
        <span className={`px-2 py-0.5 text-xs rounded ${isActive ? 'bg-green-400/30 text-green-100' : 'bg-red-400/30 text-red-100'}`}>
          {isActive ? statusLabels.active : statusLabels.inactive}
        </span>
      </div>
    </div>
  );
}
