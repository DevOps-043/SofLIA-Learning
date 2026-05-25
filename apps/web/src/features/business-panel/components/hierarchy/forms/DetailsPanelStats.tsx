import type { Region, Team, Zone } from '../../../types/hierarchy.types';
import type { DetailsPanelType } from './details-panel.types';

interface DetailsPanelStatsProps {
  data: Region | Team | Zone;
  labels: {
    assignedUsers: string;
    capacity: string;
    goal: string;
    members: string;
    monthlyTarget: string;
    stats: string;
    teams: string;
    users: string;
    zones: string;
  };
  type: DetailsPanelType;
}

export function DetailsPanelStats({ data, labels, type }: DetailsPanelStatsProps) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-3">{labels.stats}</h4>
      <div className="grid grid-cols-2 gap-3">
        {type === 'region' && <RegionStats data={data as Region} labels={labels} />}
        {type === 'zone' && <ZoneStats data={data as Zone} labels={labels} />}
        {type === 'team' && <TeamStats data={data as Team} labels={labels} />}
      </div>
    </div>
  );
}

function StatCard({ className = '', label, value }: { className?: string; label: string; value: string | number }) {
  return (
    <div className={`p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg ${className}`}>
      <p className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
      <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
    </div>
  );
}

function RegionStats({ data, labels }: { data: Region; labels: DetailsPanelStatsProps['labels'] }) {
  return (
    <>
      <StatCard label={labels.zones} value={data.zones_count || 0} />
      <StatCard label={labels.teams} value={data.teams_count || 0} />
      <StatCard className="col-span-2" label={labels.assignedUsers} value={data.users_count || 0} />
    </>
  );
}

function ZoneStats({ data, labels }: { data: Zone; labels: DetailsPanelStatsProps['labels'] }) {
  return (
    <>
      <StatCard label={labels.teams} value={data.teams_count || 0} />
      <StatCard label={labels.users} value={data.users_count || 0} />
    </>
  );
}

function TeamStats({ data, labels }: { data: Team; labels: DetailsPanelStatsProps['labels'] }) {
  return (
    <>
      <StatCard label={labels.members} value={data.members_count || 0} />
      <StatCard label={labels.capacity} value={data.max_members || '∞'} />
      {data.target_goal && <StatCard className="col-span-2" label={labels.goal} value={data.target_goal} />}
      {data.monthly_target && <StatCard className="col-span-2" label={labels.monthlyTarget} value={`$${data.monthly_target.toLocaleString()}`} />}
    </>
  );
}
