import { SlidersHorizontal, X } from 'lucide-react';
import styles from './PersonalizationSettings.module.css';

export function ModalHeader(props: { onClose: () => void; title: string }) {
  return (
    <header className={styles.header}>
      <div className={styles.headerIdentity}>
        <span className={styles.headerIcon} aria-hidden="true">
          <SlidersHorizontal className="h-4 w-4" />
        </span>
        <h2 id="soflia-personalization-title" className={styles.headerTitle}>
          {props.title}
        </h2>
      </div>
      <button
        type="button"
        onClick={props.onClose}
        className={styles.iconButton}
        aria-label="Cerrar"
      >
        <X className="h-4 w-4" />
      </button>
    </header>
  );
}
