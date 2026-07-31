import { useTranslation } from 'react-i18next';
import type { Region, Team, Zone } from '../../../types/hierarchy.types';
import { getHierarchyTypeLabel } from '../hierarchy-labels';
import { DescriptionBlock, ManagerCard } from './DetailsPanelProfile';
import { DetailsPanelAuditInfo } from './DetailsPanelAuditInfo';
import { DetailsPanelHeader } from './DetailsPanelHeader';
import { DetailsPanelLocationContact } from './DetailsPanelLocationContact';
import { DetailsPanelStats } from './DetailsPanelStats';
import type { DetailsPanelProps } from './details-panel.types';

export function DetailsPanel({ data, isOpen, onClose, onEdit, type }: DetailsPanelProps) {
  const { t, i18n } = useTranslation('business');
  if (!isOpen || !data) return null;

  const manager = type === 'team' ? (data as Team).leader : (data as Region | Zone).manager;
  const managerLabels = {
    region: t('hierarchy.managers.region'),
    team: t('hierarchy.managers.team'),
    zone: t('hierarchy.managers.zone'),
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-white dark:bg-neutral-800 shadow-xl z-50 transform transition-transform overflow-hidden">
      <div className="h-full flex flex-col">
        <DetailsPanelHeader
          code={data.code}
          isActive={data.is_active}
          name={data.name}
          onClose={onClose}
          onEdit={onEdit}
          statusLabels={{ active: t('hierarchy.statusActive'), inactive: t('hierarchy.statusInactive') }}
          type={type}
          typeLabel={getHierarchyTypeLabel(type, t)}
        />
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <DescriptionBlock description={data.description} label={t('hierarchy.description')} />
          <ManagerCard label={managerLabels[type]} manager={manager} unassignedLabel={t('hierarchy.unassigned')} />
          <DetailsPanelStats
            data={data}
            type={type}
            labels={{
              assignedUsers: t('hierarchy.assignedUsers'),
              capacity: t('hierarchy.capacity'),
              goal: t('hierarchy.goal'),
              members: t('hierarchy.members'),
              monthlyTarget: t('hierarchy.monthlyTarget'),
              stats: t('hierarchy.stats'),
              teams: t('hierarchy.teams'),
              users: t('hierarchy.users'),
              zones: t('hierarchy.zones'),
            }}
          />
          <DetailsPanelLocationContact
            contactLabel={t('hierarchy.contact')}
            data={data}
            locationLabel={t('hierarchy.location')}
          />
          <DetailsPanelAuditInfo
            data={data}
            language={i18n.language}
            labels={{ created: t('hierarchy.created'), info: t('hierarchy.info'), updated: t('hierarchy.updated') }}
          />
        </div>
      </div>
    </div>
  );
}
