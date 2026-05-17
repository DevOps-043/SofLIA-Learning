import { formatDate } from '@/utils/date-formatter';
import type { Region, Team, Zone } from '../../../types/hierarchy.types';

interface DetailsPanelAuditInfoProps {
  data: Region | Team | Zone;
  labels: {
    created: string;
    info: string;
    updated: string;
  };
  language: string;
}

export function DetailsPanelAuditInfo({ data, labels, language }: DetailsPanelAuditInfoProps) {
  return (
    <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
      <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-3">{labels.info}</h4>
      <div className="space-y-2 text-sm">
        <AuditRow label={labels.created} value={formatDate(data.created_at, language, { day: 'numeric', month: 'short', year: 'numeric' })} />
        <AuditRow label={labels.updated} value={formatDate(data.updated_at, language, { day: 'numeric', month: 'short', year: 'numeric' })} />
      </div>
    </div>
  );
}

function AuditRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-neutral-500 dark:text-neutral-400">{label}</span>
      <span className="text-neutral-900 dark:text-white">{value}</span>
    </div>
  );
}
