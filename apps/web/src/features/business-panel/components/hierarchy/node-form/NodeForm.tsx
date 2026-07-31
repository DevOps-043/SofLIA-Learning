'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Building2, ChevronDown, Loader2, Plus, X } from 'lucide-react'
import { useParams } from 'next/navigation'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { OrganizationNode, OrganizationNodeProperties } from '../../../types/dynamicHierarchy.types'
import styles from '../HierarchyExperience.module.css'
import { getHierarchyTypeLabel } from '../hierarchy-labels'
import { useHierarchyDialog } from '../useHierarchyDialog'
import { ManagerSelector } from './ManagerSelector'
import { PropertiesFormBuilder } from './PropertiesFormBuilder'
import { useGeocoding } from './useGeocoding'
import { useNodeFormState } from './useNodeFormState'

export interface NodeFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string, type: string, properties?: OrganizationNodeProperties, managerId?: string) => Promise<void>
  mode: 'create' | 'edit'
  parentNode?: OrganizationNode
  nodeToEdit?: OrganizationNode
}

const NODE_TYPES = ['region', 'zone', 'team', 'custom'] as const

export function NodeForm({
  isOpen,
  onClose,
  onSave,
  mode,
  parentNode,
  nodeToEdit,
}: NodeFormProps) {
  const { t } = useTranslation('business')
  const { t: tc } = useTranslation('common')
  const params = useParams()
  const orgSlug = params?.orgSlug as string | undefined
  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false)
  const form = useNodeFormState(isOpen, mode, onSave, onClose, parentNode, nodeToEdit)
  const dialogRef = useHierarchyDialog({ isOpen, onClose, preventClose: form.loading })

  const { handleGeocode, handleReverseGeocode, isGeocoding, geocodeError } = useGeocoding(
    {
      street: form.street,
      externalNumber: form.externalNumber,
      neighborhood: form.neighborhood,
      city: form.city,
      nodeState: form.nodeState,
      country: form.country,
      zipCode: form.zipCode,
      latitude: form.latitude,
      longitude: form.longitude,
    },
    {
      setStreet: form.setStreet,
      setExternalNumber: form.setExternalNumber,
      setNeighborhood: form.setNeighborhood,
      setCity: form.setCity,
      setNodeState: form.setNodeState,
      setCountry: form.setCountry,
      setZipCode: form.setZipCode,
      setLatitude: form.setLatitude,
      setLongitude: form.setLongitude,
    },
    orgSlug,
  )

  if (!isOpen) return null

  const title = mode === 'create'
    ? t('hierarchy.nodeForm.title.create', { parent: parentNode?.name })
    : t('hierarchy.nodeForm.title.edit')
  const description = mode === 'create'
    ? t('hierarchy.nodeForm.sideTitle.create')
    : t('hierarchy.nodeForm.sideTitle.edit')
  const isRootNode = mode === 'edit' && nodeToEdit?.type.toLocaleLowerCase() === 'root'
  const selectedTypeLabel = getHierarchyTypeLabel(form.type, t)

  const handleSubmit = (event: FormEvent) => {
    setIsTypeMenuOpen(false)
    void form.handleSubmit(event)
  }

  return (
    <AnimatePresence>
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseDown={event => {
          if (event.target === event.currentTarget && !form.loading) onClose()
        }}
      >
        <motion.div
          ref={dialogRef}
          className={`${styles.dialogWide} ${styles.nodeFormDialog}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="node-form-title"
          aria-describedby="node-form-description"
          data-testid="node-form-dialog"
          initial={{ opacity: 0, scale: 0.975, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.975, y: 18 }}
          transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        >
          <header className={styles.dialogHeader}>
            <div className={styles.dialogIcon}><Building2 aria-hidden="true" /></div>
            <div className={styles.dialogHeading}>
              <p className={styles.dialogKicker}>{t('hierarchy.nodeForm.architecture')}</p>
              <h2 id="node-form-title" className={styles.dialogTitle}>{title}</h2>
              <p id="node-form-description" className={styles.dialogDescription}>{description} · {t('hierarchy.nodeForm.sideDescription')}</p>
            </div>
            <button type="button" onClick={onClose} disabled={form.loading} className={styles.iconButton} aria-label={tc('actions.close')}>
              <X aria-hidden="true" />
            </button>
          </header>

          <form onSubmit={handleSubmit} className={styles.dialogForm}>
            <div className={styles.dialogBody} data-testid="node-form-scroll-region">
              <div className={styles.formStack}>
                <section className={styles.formStack} aria-labelledby="node-basic-data-title">
                  <h3 id="node-basic-data-title" className={styles.formSectionTitle}>
                    <Building2 aria-hidden="true" />
                    {t('hierarchy.nodeForm.sections.basicData')}
                  </h3>
                  <div className={styles.formGrid}>
                    <label className={styles.fieldGroup}>
                      <span className={styles.fieldLabel}>{t('hierarchy.nodeForm.fields.name')}</span>
                      <input
                        autoFocus
                        type="text"
                        value={form.name}
                        onChange={event => form.setName(event.target.value)}
                        placeholder={t('hierarchy.nodeForm.placeholders.name')}
                        className={styles.input}
                      />
                    </label>

                    <div className={styles.fieldGroup}>
                      <span className={styles.fieldLabel}>{t('hierarchy.nodeForm.fields.type')}</span>
                      <div className={styles.selectRoot}>
                        <button
                          type="button"
                          className={styles.selectTrigger}
                          data-open={isTypeMenuOpen}
                          aria-haspopup="listbox"
                          aria-expanded={isTypeMenuOpen}
                          disabled={isRootNode}
                          onClick={() => setIsTypeMenuOpen(current => !current)}
                        >
                          <Building2 aria-hidden="true" />
                          <span className={styles.selectValue}>{selectedTypeLabel}</span>
                          <ChevronDown aria-hidden="true" />
                        </button>
                        {isTypeMenuOpen && !isRootNode ? (
                          <div className={styles.selectMenu} role="listbox">
                            {NODE_TYPES.map(type => {
                              const label = getHierarchyTypeLabel(type, t)
                              return (
                                <button
                                  key={type}
                                  type="button"
                                  role="option"
                                  aria-selected={form.type === type}
                                  className={`${styles.selectOption} ${form.type === type ? styles.selectOptionActive : ''}`}
                                  onClick={() => {
                                    form.setType(type)
                                    setIsTypeMenuOpen(false)
                                  }}
                                >
                                  <span>{label}</span>
                                  {form.type === type ? <span className={styles.selectOptionDot} aria-hidden="true" /> : null}
                                </button>
                              )
                            })}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {form.type === 'custom' ? (
                    <motion.label initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className={styles.fieldGroup}>
                      <span className={styles.fieldLabel}>{t('hierarchy.nodeForm.fields.specifyType')}</span>
                      <input
                        type="text"
                        value={form.customType}
                        onChange={event => form.setCustomType(event.target.value)}
                        placeholder={t('hierarchy.nodeForm.placeholders.specifyType')}
                        className={styles.input}
                      />
                    </motion.label>
                  ) : null}
                </section>

                <section className={styles.formSection} aria-labelledby="node-management-title">
                  <h3 id="node-management-title" className={styles.formSectionTitle}>
                    <Building2 aria-hidden="true" />
                    {t('hierarchy.nodeForm.sections.sofliaManagement')}
                  </h3>
                  <ManagerSelector
                    selectedManager={form.selectedManager}
                    managerSearch={form.managerSearch}
                    managerResults={form.managerResults}
                    isSearchingManager={form.isSearchingManager}
                    onSearchChange={form.setManagerSearch}
                    onSelectManager={user => {
                      form.setSelectedManager(user)
                      form.setManagerId(user.id)
                      form.setManagerSearch('')
                      form.setManagerResults([])
                    }}
                    onClearManager={() => {
                      form.setSelectedManager(null)
                      form.setManagerId(null)
                      form.setManagerSearch('')
                    }}
                  />
                </section>

                <PropertiesFormBuilder
                  street={form.street}
                  externalNumber={form.externalNumber}
                  internalNumber={form.internalNumber}
                  neighborhood={form.neighborhood}
                  zipCode={form.zipCode}
                  city={form.city}
                  nodeState={form.nodeState}
                  country={form.country}
                  latitude={form.latitude}
                  longitude={form.longitude}
                  loading={form.loading}
                  isGeocoding={isGeocoding}
                  onStreetChange={form.setStreet}
                  onExternalNumberChange={form.setExternalNumber}
                  onInternalNumberChange={form.setInternalNumber}
                  onNeighborhoodChange={form.setNeighborhood}
                  onZipCodeChange={form.setZipCode}
                  onCityChange={form.setCity}
                  onNodeStateChange={form.setNodeState}
                  onCountryChange={form.setCountry}
                  onLatitudeChange={form.setLatitude}
                  onLongitudeChange={form.setLongitude}
                  onGeocode={handleGeocode}
                  onReverseGeocode={handleReverseGeocode}
                />

                {geocodeError || form.saveError ? (
                  <p className={styles.formError}>{geocodeError || form.saveError}</p>
                ) : null}
              </div>
            </div>

            <footer className={styles.dialogFooter} data-testid="node-form-footer">
              <button type="button" onClick={onClose} disabled={form.loading} className={styles.secondaryButton}>
                {tc('actions.close')}
              </button>
              <button type="submit" disabled={form.loading || !form.name.trim()} className={styles.primaryButton}>
                {form.loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Plus aria-hidden="true" />}
                {form.loading ? tc('actions.saving') : tc('actions.saveChanges')}
              </button>
            </footer>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
