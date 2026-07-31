'use client';

import { motion } from 'framer-motion';
import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { HierarchyTree } from '@/features/business-panel/components/hierarchy/HierarchyTree';
import { HierarchySettings } from '@/features/business-panel/components/hierarchy/HierarchySettings';
import { Settings, LayoutGrid, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme';
import { useTour } from '@/features/tours';
import { businessPanelHierarchyTour } from '@/features/tours/config/business-panel-hierarchy.tour';
import styles from '@/features/business-panel/components/hierarchy/HierarchyExperience.module.css';

type HierarchyVariables = CSSProperties & Record<`--hierarchy-${string}`, string>;

export default function BusinessPanelHierarchyPage() {
  const [activeTab, setActiveTab] = useState<'settings' | 'tree'>('tree');
  const { t } = useTranslation('business');
  const theme = useBusinessPanelTheme();
  const { autoStartIfNeeded } = useTour(businessPanelHierarchyTour);

  useEffect(() => {
    return autoStartIfNeeded();
  }, [autoStartIfNeeded]);
  const tabs: Array<{ id: 'tree' | 'settings'; label: string; icon: LucideIcon }> = [
    { id: 'tree', label: t('hierarchy.tabs.treeView'), icon: LayoutGrid },
    { id: 'settings', label: t('hierarchy.tabs.settings'), icon: Settings },
  ];
  const hierarchyVariables: HierarchyVariables = {
    '--hierarchy-accent': theme.accentColor,
    '--hierarchy-action': theme.actionColor,
    '--hierarchy-border': theme.borderColor,
    '--hierarchy-danger': theme.dangerColor,
    '--hierarchy-divider': theme.dividerColor,
    '--hierarchy-input': theme.inputBg,
    '--hierarchy-muted': theme.mutedTextColor,
    '--hierarchy-on-action': theme.onActionColor,
    '--hierarchy-primary': theme.primaryColor,
    '--hierarchy-subtext': theme.subtextColor,
    '--hierarchy-success': theme.successColor,
    '--hierarchy-surface': theme.cardBg,
    '--hierarchy-text': theme.textColor,
    '--hierarchy-warning': theme.warningColor,
  };

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={styles.page}
      style={hierarchyVariables}
      data-tour-id="business-panel-hierarchy--page"
    >
      <div className={styles.pageStack}>
        <section
          className={styles.hero}
          style={{ background: theme.heroBackground, borderColor: theme.heroBorderColor }}
          data-tour-id="business-panel-hierarchy--header"
          aria-labelledby="hierarchy-page-title"
        >
          <div className={styles.heroAtmosphere} aria-hidden="true" />
          <div className={styles.heroRingLarge} aria-hidden="true" />
          <div className={styles.heroRingSmall} aria-hidden="true" />
          <div className={styles.heroDot} aria-hidden="true" />
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>{t('hierarchy.pageKicker')}</p>
            <h1 id="hierarchy-page-title" className={styles.heroTitle}>
              {t('hierarchy.pageTitle')}
            </h1>
            <p className={styles.heroDescription}>{t('hierarchy.pageSubtitle')}</p>
          </div>
          <div
            className={styles.heroTabs}
            data-tour-id="business-panel-hierarchy--tabs"
            role="tablist"
            aria-label={t('hierarchy.pageTitle')}
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`hierarchy-${tab.id}-panel`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${styles.heroTab} ${isActive ? styles.heroTabActive : ''}`}
                >
                  <Icon aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <motion.section
          id={`hierarchy-${activeTab}-panel`}
          role="tabpanel"
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className={styles.tabPanel}
        >
          {activeTab === 'settings' ? <HierarchySettings /> : <HierarchyTree />}
        </motion.section>
      </div>
    </motion.main>
  );
}
