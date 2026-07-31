import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import styles from './InviteForm.module.css';

export function InviteErrorAlert({ error }: { error?: string | null }) {
  if (!error) return null;

  return (
    <motion.div animate={{ opacity: 1, y: 0 }} className={styles.error} initial={{ opacity: 0, y: -8 }}>
      <AlertCircle aria-hidden="true" />
      <span>{error}</span>
    </motion.div>
  );
}
