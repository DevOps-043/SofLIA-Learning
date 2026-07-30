import styles from './PersonalizationSettings.module.css';

interface ToggleFieldProps {
  checked: boolean;
  description: string;
  label: string;
  onChange: (checked: boolean) => void;
}

export function ToggleField({
  checked,
  description,
  label,
  onChange,
}: ToggleFieldProps) {
  return (
    <div className={styles.toggleRow}>
      <div className={styles.toggleCopy}>
        <p className={styles.toggleTitle}>{label}</p>
        <p className={styles.toggleDescription}>{description}</p>
      </div>
      <label className={styles.toggleLabel}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className={styles.toggleInput}
        />
        <span className={styles.toggleTrack} />
        <span className={styles.toggleThumb} />
      </label>
    </div>
  );
}
