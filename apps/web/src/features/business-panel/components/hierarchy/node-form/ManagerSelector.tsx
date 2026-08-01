'use client'

import { Loader2, Search, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styles from '../HierarchyExperience.module.css'
import type { NodeManagerUser } from './node-form.utils'

interface ManagerSelectorProps {
  selectedManager: NodeManagerUser | null
  managerSearch: string
  managerResults: NodeManagerUser[]
  isSearchingManager: boolean
  onSearchChange: (value: string) => void
  onSelectManager: (user: NodeManagerUser) => void
  onClearManager: () => void
}

export function ManagerSelector({
  selectedManager,
  managerSearch,
  managerResults,
  isSearchingManager,
  onSearchChange,
  onSelectManager,
  onClearManager,
}: ManagerSelectorProps) {
  const { t } = useTranslation('business')
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className={styles.fieldGroup}>
      <span className={styles.fieldLabel}>{t('hierarchy.nodeForm.fields.manager')}</span>

      {selectedManager ? (
        <div className={styles.resultRow}>
          <span className={styles.memberAvatar}>
            {selectedManager.profile_picture_url ? (
              <img src={selectedManager.profile_picture_url} alt="" />
            ) : (
              (selectedManager.first_name?.[0] || selectedManager.username?.[0] || '?').toUpperCase()
            )}
          </span>
          <span>
            <span className={styles.memberName}>{selectedManager.first_name} {selectedManager.last_name}</span>
            <span className={styles.memberEmail}>{selectedManager.email}</span>
          </span>
          <button
            type="button"
            onClick={onClearManager}
            className={styles.iconButton}
            aria-label={t('hierarchy.nodeForm.fields.manager')}
          >
            <X aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div
          className={styles.selectRoot}
          onBlur={event => {
            if (!event.currentTarget.contains(event.relatedTarget)) setIsExpanded(false)
          }}
        >
          <label className={styles.searchField}>
            <Search aria-hidden="true" />
            <input
              type="search"
              value={managerSearch}
              onChange={event => onSearchChange(event.target.value)}
              onFocus={() => setIsExpanded(true)}
              placeholder={t('hierarchy.nodeForm.placeholders.searchUser')}
              className={styles.input}
            />
            {isSearchingManager ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          </label>

          {isExpanded ? (
            <div className={styles.selectMenu} role="listbox">
              {isSearchingManager ? (
                <div className={styles.managerSearchState} role="status">
                  <Loader2 className="animate-spin" aria-hidden="true" />
                  <span>{t('hierarchy.nodeForm.searchingUsers', { defaultValue: 'Buscando usuarios…' })}</span>
                </div>
              ) : managerResults.length === 0 ? (
                <p className={styles.managerSearchState}>
                  {t('hierarchy.nodeForm.noUsers', { defaultValue: 'No hay usuarios disponibles en la organización.' })}
                </p>
              ) : managerResults.map(user => (
                <button
                  key={user.id}
                  type="button"
                  role="option"
                  aria-selected="false"
                  onClick={() => onSelectManager(user)}
                  className={styles.resultRow}
                >
                  <span className={styles.memberAvatar}>
                    {user.profile_picture_url ? (
                      <img src={user.profile_picture_url} alt="" />
                    ) : (
                      (user.first_name?.[0] || '?').toUpperCase()
                    )}
                  </span>
                  <span>
                    <span className={styles.memberName}>{user.first_name} {user.last_name}</span>
                    <span className={styles.memberEmail}>{user.email}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
