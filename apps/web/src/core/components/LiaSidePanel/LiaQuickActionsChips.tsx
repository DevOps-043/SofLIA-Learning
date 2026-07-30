'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LiaQuickAction, LiaThemeColors } from './types';
import styles from './LiaSidePanel.module.css';

interface LiaQuickActionsChipsProps {
  quickActions: LiaQuickAction[];
  isLoading: boolean;
  isLightTheme: boolean;
  themeColors: LiaThemeColors;
  onActionClick: (action: LiaQuickAction) => void;
  forceCollapse?: boolean | number;
}

const SKELETON_PLACEHOLDERS = 4;
const ANIMATION_DURATION = 0.18;

export function LiaQuickActionsChips({
  quickActions,
  isLoading,
  onActionClick,
  forceCollapse,
}: LiaQuickActionsChipsProps) {
  const { t } = useTranslation('common');
  const [isExpanded, setIsExpanded] = useState(!forceCollapse);

  React.useEffect(() => {
    if (forceCollapse) {
      setIsExpanded(false);
    }
  }, [forceCollapse]);

  if (!isLoading && quickActions.length === 0) {
    return null;
  }

  const regionLabel = t('lia.lessonSuggestions.title', 'Sugerencias');

  return (
    <section
      role="region"
      aria-label={regionLabel}
      className={styles.quickActions}
    >
      <div className={styles.quickHeader}>
        <div className={styles.quickLabel}>
          <Sparkles
            size={13}
            aria-hidden="true"
            className={styles.quickLabelIcon}
          />
          <span>
            {isLoading
              ? t('lia.lessonSuggestions.loading', 'Cargando sugerencias...')
              : regionLabel}
          </span>
        </div>

        {!isLoading && (
          <button
            type="button"
            className={styles.quickToggle}
            onClick={() => setIsExpanded((value) => !value)}
            aria-expanded={isExpanded}
          >
            <span>
              {isExpanded
                ? t('actions.hide', 'Ocultar')
                : t('actions.show', 'Mostrar')}
            </span>
            <motion.span
              aria-hidden="true"
              animate={{ rotate: isExpanded ? 0 : -90 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={12} />
            </motion.span>
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className={styles.quickGrid}>
              {isLoading
                ? Array.from({ length: SKELETON_PLACEHOLDERS }).map((_, index) => (
                    <div
                      key={`skeleton-${String(index)}`}
                      className={styles.quickSkeleton}
                      aria-hidden="true"
                    />
                  ))
                : quickActions.map((action, index) => {
                    const Icon = action.icon;

                    return (
                      <motion.button
                        key={action.id}
                        type="button"
                        className={styles.quickChip}
                        onClick={() => onActionClick(action)}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{
                          duration: ANIMATION_DURATION,
                          delay: index * 0.025,
                        }}
                        aria-label={action.label}
                      >
                        <Icon
                          size={14}
                          aria-hidden="true"
                          className={styles.quickChipIcon}
                        />
                        <span>{action.label}</span>
                      </motion.button>
                    );
                  })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
