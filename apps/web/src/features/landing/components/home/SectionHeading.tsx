import { BlurText } from './react-bits/BlurText';
import styles from './SofliaHome.module.css';

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
  titleId?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  titleId,
}: SectionHeadingProps) {
  return (
    <header className={styles.sectionHeader}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h2 id={titleId} className={styles.sectionTitle}>
        <BlurText text={title} delay={55} />
      </h2>
      {description ? <p className={styles.sectionDescription}>{description}</p> : null}
    </header>
  );
}
