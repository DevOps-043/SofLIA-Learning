import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type React from 'react';
import styles from './PersonalizationSettings.module.css';

interface SectionProps {
  children: React.ReactNode;
  description: string;
  icon: React.ElementType;
  isExpanded: boolean;
  onToggle: () => void;
  title: string;
}

export function Section({
  children,
  description,
  icon: Icon,
  isExpanded,
  onToggle,
  title,
}: SectionProps) {
  return (
    <div className={`${styles.section} ${isExpanded ? styles.sectionExpanded : ''}`}>
      <button
        type="button"
        onClick={onToggle}
        className={styles.sectionButton}
        aria-expanded={isExpanded}
      >
        <div className={styles.sectionIdentity}>
          <span className={styles.sectionIcon} aria-hidden="true">
            <Icon className="h-4 w-4" />
          </span>
          <div className={styles.sectionCopy}>
            <h3 className={styles.sectionTitle}>{title}</h3>
            <p className={styles.sectionDescription}>{description}</p>
          </div>
        </div>
        <motion.span
          className={styles.chevron}
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.18 }}
          aria-hidden="true"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className={styles.sectionContent}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
