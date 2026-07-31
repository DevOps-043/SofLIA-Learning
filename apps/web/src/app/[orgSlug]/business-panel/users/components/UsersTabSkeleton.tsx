'use client'

import styles from './UsersPanel.module.css'

/**
 * Esqueleto acotado a la lista de la pestaña activa.
 *
 * Al cambiar de pestaña solo se recarga el recurso, así que la cabecera, las
 * estadísticas y los filtros siguen montados: sustituir la página entera por un
 * esqueleto se percibía como una recarga completa.
 */
export function UsersTabSkeleton({
  viewMode,
  rows = 6,
}: {
  viewMode: 'cards' | 'list'
  rows?: number
}) {
  const isCards = viewMode === 'cards'

  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={isCards ? styles.cardGrid : styles.list}
    >
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={`users-skeleton-${String(index)}`}
          aria-hidden="true"
          className={isCards ? styles.cardSkeleton : styles.rowSkeleton}
        />
      ))}
    </div>
  )
}
