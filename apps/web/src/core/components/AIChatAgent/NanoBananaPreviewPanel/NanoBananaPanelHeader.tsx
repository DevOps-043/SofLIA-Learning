'use client';

import type React from 'react';
import { Code2, Eye, X } from 'lucide-react';
import {
  DOMAIN_COLORS,
  DOMAIN_ICONS,
  DOMAIN_NAMES,
  FORMAT_NAMES
} from './preview-panel.constants';
import type { NanoBananaPanelHeaderProps, NanoBananaViewMode } from './types';

const VIEW_MODE_ICONS: Record<NanoBananaViewMode, React.ReactNode> = {
  visual: <Eye className="w-3.5 h-3.5" />,
  json: <Code2 className="w-3.5 h-3.5" />
};

export function NanoBananaPanelHeader({
  domain,
  outputFormat,
  viewMode,
  onClose,
  onViewModeChange
}: NanoBananaPanelHeaderProps) {
  return (
    <div className={`bg-gradient-to-r ${DOMAIN_COLORS[domain]} p-[1px]`}>
      <div className="bg-gray-900/95 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${DOMAIN_COLORS[domain]}`}>
              {DOMAIN_ICONS[domain]}
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">NanoBanana JSON</h3>
              <p className="text-gray-400 text-xs">
                {DOMAIN_NAMES[domain]} - {FORMAT_NAMES[outputFormat]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ViewModeToggle({
  viewMode,
  onViewModeChange
}: Pick<NanoBananaPanelHeaderProps, 'viewMode' | 'onViewModeChange'>) {
  return (
    <div className="flex bg-gray-800/50 rounded-lg p-1">
      {(['visual', 'json'] as const).map((mode) => (
        <button
          key={mode}
          onClick={() => onViewModeChange(mode)}
          className={`px-2 py-1 rounded text-xs transition-colors ${
            viewMode === mode ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {VIEW_MODE_ICONS[mode]}
        </button>
      ))}
    </div>
  );
}
