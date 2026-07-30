import { ArrowRight, Home } from 'lucide-react'
import Link from 'next/link'

import { SystemErrorScene } from './_components/system-error/SystemErrorScene'
import styles from './_components/system-error/SystemErrorScene.module.css'

export default function NotFound() {
  return (
    <SystemErrorScene
      code="404"
      eyebrow="Ruta no disponible"
      title="Esta página ya no está aquí."
      description="Es posible que el contenido se haya movido o que el enlace haya cambiado. Puedes volver al inicio o acceder directamente a tu cuenta."
      actions={
        <>
          <Link href="/" className={styles.primaryButton}>
            <Home className="h-4 w-4" aria-hidden="true" />
            Volver al inicio
          </Link>
          <Link href="/auth" className={styles.secondaryButton}>
            Acceso clientes
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </>
      }
    />
  )
}
