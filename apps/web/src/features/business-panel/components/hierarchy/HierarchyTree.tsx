import React from 'react';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Building2, Layers3, Network, UserRoundCheck, Users } from 'lucide-react';
import { HierarchyActions } from './hierarchy-tree/HierarchyActions';
import { HierarchyInlineAlerts } from './hierarchy-tree/HierarchyInlineAlerts';
import { HierarchyTreeBody } from './hierarchy-tree/HierarchyTreeBody';
import { HierarchyTreeModals } from './hierarchy-tree/HierarchyTreeModals';
import { StructureSelector } from './hierarchy-tree/StructureSelector';
import { useHierarchyTreeCommands } from './hierarchy-tree/useHierarchyTreeCommands';
import { useHierarchyTreeState } from './hierarchy-tree/useHierarchyTreeState';
import styles from './HierarchyExperience.module.css';

interface HierarchyTreeProps {
  initialStructureId?: string;
}

export const HierarchyTree: React.FC<HierarchyTreeProps> = ({ initialStructureId }) => {
  const { t } = useTranslation('business');
  const { t: tc } = useTranslation('common');
  const params = useParams();
  const orgSlug = params?.orgSlug as string | undefined;
  const state = useHierarchyTreeState(initialStructureId, t, orgSlug);
  const commands = useHierarchyTreeCommands(state, t);
  const selectedStructure = state.structures.find((structure) => structure.id === state.selectedStructureId);
  const memberCount = state.nodes.reduce((total, node) => total + (node.members_count || 0), 0);
  const leaderCount = state.nodes.filter((node) => Boolean(node.manager_id || node.manager)).length;
  const levelCount = state.nodes.length > 0
    ? Math.max(...state.nodes.map((node) => node.depth), 0) + 1
    : 0;
  const summary = [
    {
      icon: Building2,
      label: t('hierarchy.summary.structures', { defaultValue: 'Estructuras' }),
      value: state.structures.length,
      tone: 'navy',
    },
    {
      icon: Layers3,
      label: t('hierarchy.summary.levels', { defaultValue: 'Niveles' }),
      value: levelCount,
      tone: 'teal',
    },
    {
      icon: Users,
      label: t('hierarchy.summary.members', { defaultValue: 'Miembros' }),
      value: memberCount,
      tone: 'amber',
    },
    {
      icon: UserRoundCheck,
      label: t('hierarchy.summary.leaders', { defaultValue: 'Responsables' }),
      value: leaderCount,
      tone: 'mint',
    },
  ];

  return (
    <div className={styles.treeExperience}>
      <section
        className={styles.treeSummary}
        aria-label={t('hierarchy.summary.label', { defaultValue: 'Resumen de estructura' })}
      >
        {summary.map(({ icon: Icon, label, value, tone }) => (
          <article key={label} className={styles.treeSummaryItem} data-tone={tone}>
            <span className={styles.treeSummaryIcon} aria-hidden="true">
              <Icon />
            </span>
            <span className={styles.treeSummaryCopy}>
              <span className={styles.treeSummaryLabel}>{label}</span>
              <strong className={styles.treeSummaryValue}>{value}</strong>
            </span>
          </article>
        ))}
      </section>

      <section className={styles.treeWorkspace}>
        <aside className={styles.treeSidebar}>
          <div className={styles.treeSidebarHeader}>
            <span className={styles.treeSidebarIcon} aria-hidden="true">
              <Network />
            </span>
            <div>
              <p className={styles.sectionKicker}>
                {t('hierarchy.workspace.controlKicker', { defaultValue: 'Centro de estructura' })}
              </p>
              <h2 className={styles.treeSidebarTitle}>
                {t('hierarchy.workspace.controlTitle', { defaultValue: 'Arquitectura organizacional' })}
              </h2>
            </div>
          </div>
          <p className={styles.treeSidebarDescription}>
            {t('hierarchy.workspace.controlDescription', {
              defaultValue: 'Selecciona una estructura y administra sus niveles desde un solo lugar.',
            })}
          </p>

          <div className={styles.treeSidebarSection} data-tour-id="business-panel-hierarchy--structure-selector">
            <StructureSelector state={state} t={t} />
          </div>

          <div className={styles.activeStructureCard}>
            <span className={styles.activeStructureMark} aria-hidden="true" />
            <div>
              <span className={styles.activeStructureLabel}>
                {selectedStructure
                  ? t('hierarchy.workspace.currentStructure', { defaultValue: 'Estructura en uso' })
                  : t('hierarchy.workspace.noStructure', { defaultValue: 'Sin estructura seleccionada' })}
              </span>
              <strong>{selectedStructure?.name || t('hierarchy.selectStructure')}</strong>
            </div>
          </div>

          <div className={styles.treeSidebarActions} data-tour-id="business-panel-hierarchy--actions">
            <HierarchyActions
              onNewStructure={() => state.setShowStructureModal(true)}
              onOpenMembers={commands.openRootMembers}
              t={t}
            />
          </div>
        </aside>

        <div className={styles.treeCanvas}>
          <header className={styles.treeCanvasHeader}>
            <div className={styles.treeCanvasHeading}>
              <p className={styles.sectionKicker}>
                {t('hierarchy.workspace.mapKicker', { defaultValue: 'Mapa organizacional' })}
              </p>
              <h2 className={styles.treeCanvasTitle}>
                {selectedStructure?.name || t('hierarchy.pageTitle')}
              </h2>
              <p className={styles.treeCanvasDescription}>
                {t('hierarchy.workspace.mapDescription', {
                  defaultValue: 'Visualiza relaciones, responsables y miembros de cada nivel.',
                })}
              </p>
            </div>
            <div className={styles.treeCanvasStatus}>
              <span className={styles.liveDot} aria-hidden="true" />
              <span>{t('hierarchy.summary.levels')}</span>
              <span aria-hidden="true">·</span>
              <strong>{state.nodes.length}</strong>
            </div>
          </header>

          <div className={styles.treeCanvasContent}>
            <HierarchyInlineAlerts
              onConfirmDeleteNode={commands.confirmDeleteNode}
              onConfirmDeleteStructure={commands.confirmDeleteStructure}
              state={state}
              t={t}
              tc={tc}
            />

            <div data-tour-id="business-panel-hierarchy--tree-body">
              <HierarchyTreeBody
                onCreateStructure={() => state.setShowStructureModal(true)}
                onInitializeRootNode={commands.initializeRootNode}
                state={state}
                t={t}
              />
            </div>
          </div>
        </div>
      </section>

      <HierarchyTreeModals onSaveStructure={commands.saveStructure} state={state} />
    </div>
  );
};
