import { AlertTriangle, Building2, Layers3, Network, RefreshCw, Users } from 'lucide-react';
import { HierarchyMap } from './HierarchyMap';
import type { BusinessTranslator } from './types';
import type { useHierarchyTreeState } from './useHierarchyTreeState';
import styles from '../HierarchyExperience.module.css';

type HierarchyTreeState = ReturnType<typeof useHierarchyTreeState>;

interface HierarchyTreeBodyProps {
  onCreateStructure: () => void;
  onInitializeRootNode: () => Promise<void>;
  state: HierarchyTreeState;
  t: BusinessTranslator;
}

export function HierarchyTreeBody({ onCreateStructure, onInitializeRootNode, state, t }: HierarchyTreeBodyProps) {
  if (state.isLoading) {
    return (
      <div className={styles.skeletonStack} aria-live="polite" aria-label={t('hierarchy.syncing')}>
        {[0, 1, 2, 3].map((item) => <div key={item} className={styles.skeletonRow} />)}
      </div>
    );
  }

  if (state.error) {
    return (
      <div className={styles.state} role="alert">
        <div className={styles.stateIcon}>
          <AlertTriangle aria-hidden="true" />
        </div>
        <h2 className={styles.stateTitle}>{state.error}</h2>
        <p className={styles.stateDescription}>{t('hierarchy.loadHierarchyError')}</p>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => state.selectedStructureId && void state.loadNodes(state.selectedStructureId)}
        >
          <RefreshCw aria-hidden="true" />
          {t('hierarchy.syncing')}
        </button>
      </div>
    );
  }

  if (state.treeRoots.length === 0) {
    return (
      <EmptyHierarchyState
        hasStructures={state.structures.length > 0}
        onCreateStructure={onCreateStructure}
        onInitializeRootNode={onInitializeRootNode}
        t={t}
      />
    );
  }

  return (
    <HierarchyMap
      nodes={state.nodes}
      structureId={state.selectedStructureId as string}
      orgSlug={state.orgSlug}
      onAddChild={(node) => state.openNodeModal('create', node)}
      onEdit={(node) => state.openNodeModal('edit', node)}
      onDelete={(node) => {
        state.setNodeActionError(null);
        state.setPendingDeleteNode(node);
      }}
      t={t}
    />
  );
}

function EmptyHierarchyState({
  hasStructures,
  onCreateStructure,
  onInitializeRootNode,
  t,
}: Pick<HierarchyTreeBodyProps, 'onCreateStructure' | 'onInitializeRootNode' | 't'> & { hasStructures: boolean }) {
  const steps = [
    {
      icon: Building2,
      title: t('hierarchy.workspace.steps.structureTitle', { defaultValue: 'Crea la estructura' }),
      description: t('hierarchy.workspace.steps.structureDescription', { defaultValue: 'Define el modelo que organizará a tu empresa.' }),
    },
    {
      icon: Layers3,
      title: t('hierarchy.workspace.steps.levelsTitle', { defaultValue: 'Construye los niveles' }),
      description: t('hierarchy.workspace.steps.levelsDescription', { defaultValue: 'Agrega regiones, zonas, áreas o equipos.' }),
    },
    {
      icon: Users,
      title: t('hierarchy.workspace.steps.peopleTitle', { defaultValue: 'Asigna a tu equipo' }),
      description: t('hierarchy.workspace.steps.peopleDescription', { defaultValue: 'Vincula responsables y miembros a cada nivel.' }),
    },
  ];

  return (
    <div className={styles.emptyWorkspace}>
      <div className={styles.emptyWorkspaceMain}>
        <div className={styles.emptyWorkspaceVisual} aria-hidden="true">
          <span className={styles.emptyWorkspaceOrbit} />
          <span className={styles.emptyWorkspaceNode} data-position="top" />
          <span className={styles.emptyWorkspaceNode} data-position="left" />
          <span className={styles.emptyWorkspaceNode} data-position="right" />
          <Network />
        </div>
        <div className={styles.emptyWorkspaceCopy}>
          <p className={styles.sectionKicker}>
            {t('hierarchy.workspace.getStarted', { defaultValue: 'Empieza aquí' })}
          </p>
          <h2 className={styles.stateTitle}>
            {hasStructures
              ? t('hierarchy.emptyStructureTitle')
              : t('hierarchy.workspace.noStructuresTitle', { defaultValue: 'Diseña tu primera estructura' })}
          </h2>
          <p className={styles.stateDescription}>
            {hasStructures
              ? t('hierarchy.emptyStructureDesc')
              : t('hierarchy.workspace.noStructuresDescription', {
                defaultValue: 'Crea una arquitectura clara para ordenar equipos, responsables y acceso a la información.',
              })}
          </p>
          <button
            type="button"
            onClick={hasStructures ? onInitializeRootNode : onCreateStructure}
            className={styles.primaryButton}
          >
            {hasStructures
              ? t('hierarchy.initializeGeneral')
              : t('hierarchy.newStructure')}
          </button>
        </div>
      </div>

      <ol className={styles.setupSteps}>
        {steps.map(({ icon: Icon, title, description }, index) => (
          <li key={title} className={styles.setupStep}>
            <span className={styles.setupStepNumber}>{String(index + 1).padStart(2, '0')}</span>
            <span className={styles.setupStepIcon} aria-hidden="true"><Icon /></span>
            <span>
              <strong>{title}</strong>
              <small>{description}</small>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
