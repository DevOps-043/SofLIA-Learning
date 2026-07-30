'use client'

import { ArrowRight, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'

import { SystemErrorScene } from './_components/system-error/SystemErrorScene'
import styles from './_components/system-error/SystemErrorScene.module.css'
import { logger as techDebtLogger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    techDebtLogger.error('Application error:', error)
  }, [error])

  return (
    <SystemErrorScene
      code="500"
      eyebrow="Interrupción temporal"
      title="Algo no salió como esperábamos."
      description="Tu información permanece segura. Puedes intentar cargar nuevamente esta vista o regresar al inicio de SofLIA."
      detail={error.digest ? `Referencia ${error.digest}` : undefined}
      actions={
        <>
          <button type="button" onClick={reset} className={styles.primaryButton}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Intentar de nuevo
          </button>
          <Link href="/" className={styles.secondaryButton}>
            Ir al inicio
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </>
      }
    />
  )
}
