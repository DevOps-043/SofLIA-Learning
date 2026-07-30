import Image from 'next/image'
import type { CSSProperties, ReactNode } from 'react'

import styles from './SystemErrorScene.module.css'

interface SystemErrorSceneProps {
  actions: ReactNode
  code: '404' | '500'
  description: string
  detail?: string
  eyebrow: string
  style?: CSSProperties
  title: string
}

export function SystemErrorScene({
  actions,
  code,
  description,
  detail,
  eyebrow,
  style,
  title,
}: SystemErrorSceneProps) {
  return (
    <div className={styles.page} style={style}>
      <main className={styles.scene}>
        <header className={styles.topbar}>
          <span className={styles.brand}>
            <span className={styles.brandMark}>
              <Image
                alt=""
                aria-hidden="true"
                className={styles.brandImage}
                height={34}
                priority
                src="/Logo.png"
                width={25}
              />
            </span>
            SofLIA
          </span>
          <span className={styles.systemStatus}>
            Estado de la plataforma
            <span className={styles.statusDot} aria-hidden="true" />
          </span>
        </header>

        <div className={styles.content}>
          <div className={styles.codePanel} aria-hidden="true">
            <span className={styles.code}>{code}</span>
          </div>
          <div className={styles.message}>
            <p className={styles.eyebrow}>{eyebrow}</p>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.description}>{description}</p>
            <div className={styles.actions}>{actions}</div>
            {detail ? <p className={styles.detail}>{detail}</p> : null}
          </div>
        </div>
      </main>
    </div>
  )
}
