import { AlertCircle, CheckCircle2 } from 'lucide-react'
import styles from '../HierarchyExperience.module.css'

interface TeamMembersMessagesProps {
  error: string | null
  success: string | null
}

export function TeamMembersMessages({ error, success }: TeamMembersMessagesProps) {
  if (!error && !success) return null

  return (
    <div className={error ? `${styles.alert} ${styles.alertError}` : `${styles.alert} ${styles.alertSuccess}`} role="status">
      {error ? <AlertCircle aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
      <p className={styles.alertCopy}>{error || success}</p>
    </div>
  )
}
