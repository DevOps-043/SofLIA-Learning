import { HEATMAP_TABS } from './constants';
import type { HeatmapTabId } from './types';

interface HeatmapTabsProps {
  activeTab: HeatmapTabId;
  onChange: (tab: HeatmapTabId) => void;
}

export function HeatmapTabs({ activeTab, onChange }: HeatmapTabsProps) {
  return (
    <div className="mb-4 flex gap-2 border-b border-gray-200 dark:border-gray-700">
      {HEATMAP_TABS.map((tab) => (
        <button
          key={tab.id}
          className={`flex items-center gap-2 rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? 'border-b-2 border-emerald-500 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
          onClick={() => onChange(tab.id)}
          type="button"
        >
          <tab.icon className="h-4 w-4" />
          {tab.label}
        </button>
      ))}
    </div>
  );
}
