'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { BookOpen, Check, Search, X } from 'lucide-react'
import { useBusinessCourses } from '@/features/business-panel/hooks/useBusinessCourses'
import { useHierarchyDialog } from './useHierarchyDialog'
import styles from './HierarchyExperience.module.css'

interface CourseSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (courseIds: string[]) => void
  isLoading?: boolean
  title?: string
  initialSelectedIds?: string[]
}

export function CourseSelectorModal({
  isOpen,
  onClose,
  onSelect,
  isLoading = false,
  title = 'Añadir cursos',
  initialSelectedIds = [],
}: CourseSelectorModalProps) {
  const { courses, isLoading: isLoadingCourses } = useBusinessCourses()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const dialogRef = useHierarchyDialog({ isOpen, onClose, preventClose: isLoading })

  useEffect(() => {
    if (!isOpen) return
    setSelectedIds(new Set(initialSelectedIds))
    setSearchTerm('')
  }, [initialSelectedIds, isOpen])

  const filteredCourses = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase()
    if (!query) return courses
    return courses.filter((course) => {
      const searchable = [course.title, course.level, course.category].filter(Boolean).join(' ').toLocaleLowerCase()
      return searchable.includes(query)
    })
  }, [courses, searchTerm])

  const toggleSelection = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (!isOpen) return null

  return (
    <div
      className={styles.overlay}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isLoading) onClose()
      }}
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="course-selector-title"
      >
        <header className={styles.dialogHeader}>
          <span className={styles.dialogIcon}><BookOpen aria-hidden="true" /></span>
          <div className={styles.dialogHeading}>
            <p className={styles.dialogKicker}>Catálogo de aprendizaje</p>
            <h2 id="course-selector-title" className={styles.dialogTitle}>{title}</h2>
            <p className={styles.dialogDescription}>Selecciona uno o varios contenidos para esta unidad.</p>
          </div>
          <button type="button" className={styles.iconButton} onClick={onClose} disabled={isLoading} aria-label="Cerrar">
            <X aria-hidden="true" />
          </button>
        </header>

        <div className={`${styles.dialogBody} ${styles.selectorBody}`}>
          <label className={styles.searchField}>
            <Search aria-hidden="true" />
            <span className={styles.srOnly}>Buscar cursos</span>
            <input
              autoFocus
              type="search"
              placeholder="Buscar por nombre, nivel o categoría…"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className={styles.input}
            />
          </label>

          <div className={styles.selectionSummary} aria-live="polite">
            <span>{selectedIds.size} {selectedIds.size === 1 ? 'seleccionado' : 'seleccionados'}</span>
            {selectedIds.size ? (
              <button type="button" onClick={() => setSelectedIds(new Set())}>Limpiar selección</button>
            ) : null}
          </div>

          <div className={styles.resultList} aria-busy={isLoadingCourses}>
            {isLoadingCourses ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className={`${styles.resultRow} ${styles.skeletonRow}`} aria-hidden="true" />
              ))
            ) : filteredCourses.length === 0 ? (
              <div className={styles.compactEmptyState}>
                <span className={styles.stateIcon}><Search aria-hidden="true" /></span>
                <strong>No encontramos cursos</strong>
                <span>Prueba con otro nombre, nivel o categoría.</span>
              </div>
            ) : (
              filteredCourses.map((course) => {
                const isSelected = selectedIds.has(course.id)
                return (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => toggleSelection(course.id)}
                    className={styles.resultRow}
                    data-selected={isSelected}
                    aria-pressed={isSelected}
                  >
                    <span className={styles.resultThumb}>
                      {course.thumbnail_url ? (
                        <Image src={course.thumbnail_url} alt="" fill className={styles.resultThumbImage} sizes="40px" />
                      ) : (
                        <BookOpen aria-hidden="true" />
                      )}
                    </span>
                    <span className={styles.resultCopy}>
                      <strong>{course.title}</strong>
                      <span>{course.level || 'General'} · {course.category || 'Sin categoría'}</span>
                    </span>
                    <span className={styles.resultCheck} data-selected={isSelected}>
                      <Check aria-hidden="true" />
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>

        <footer className={styles.dialogFooter}>
          <button type="button" className={styles.secondaryButton} onClick={onClose} disabled={isLoading}>
            Cancelar
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => onSelect(Array.from(selectedIds))}
            disabled={isLoading || selectedIds.size === 0}
          >
            {isLoading ? 'Añadiendo…' : `Confirmar ${selectedIds.size || ''}`}
          </button>
        </footer>
      </div>
    </div>
  )
}
