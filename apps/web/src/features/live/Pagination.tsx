import styles from "./Live.module.css";
export function Pagination({
  page,
  total,
  pageSize,
  onChange,
  label,
}: {
  page: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
  label: string;
}) {
  if (total <= pageSize) return null;
  return (
    <nav className={styles.toolbar} aria-label={label}>
      <button
        className={styles.secondary}
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
      >
        Anterior
      </button>
      <span className={styles.muted}>
        {page + 1} / {Math.ceil(total / pageSize)}
      </span>
      <button
        className={styles.secondary}
        disabled={(page + 1) * pageSize >= total}
        onClick={() => onChange(page + 1)}
      >
        Siguiente
      </button>
    </nav>
  );
}
