'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Building2, CheckCircle2, GitBranch, Route, Sparkles, Trash2, X } from 'lucide-react'
import { useEffect, useState, type CSSProperties } from 'react'
import { PremiumSelect } from '@/shared/components/premium-form-controls'
import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme'
import modalStyles from './ContentModal.module.css'

export interface ContentDefaultHierarchyNode {
  depth: number
  id: string
  name: string
  type: string
}

export interface ContentDefaultRule {
  id: string
  include_descendants: boolean
  node: { name: string } | null
  scope_type: 'organization' | 'node'
}

interface ContentDefaultRulesLabels {
  activeRules: string
  applyNow: string
  applying: string
  autoAssigns: string
  directScope: string
  includeDescendants: string
  noRules: string
  nodeFallback: string
  nodeLabel: string
  saveAndApply: string
  saving: string
  scopeNode: string
  scopeOrganization: string
  selectNode: string
  selectNodeError: string
  title: string
  wholeOrganization: string
  withDescendants: string
}

interface ContentDefaultRulesModalProps {
  error: string | null
  hierarchyNodes: ContentDefaultHierarchyNode[]
  isApplying: boolean
  isOpen: boolean
  isSaving: boolean
  labels: ContentDefaultRulesLabels
  onApply: () => Promise<void>
  onClose: () => void
  onCreate: (payload: {
    includeDescendants: boolean
    nodeId: string | null
    scopeType: 'organization' | 'node'
  }) => Promise<void>
  onRevoke: (ruleId: string) => Promise<void>
  rules: ContentDefaultRule[]
  title: string
}

export function ContentDefaultRulesModal({
  error,
  hierarchyNodes,
  isApplying,
  isOpen,
  isSaving,
  labels,
  onApply,
  onClose,
  onCreate,
  onRevoke,
  rules,
  title,
}: ContentDefaultRulesModalProps) {
  const theme = useBusinessPanelTheme()
  const [scopeType, setScopeType] = useState<'organization' | 'node'>('organization')
  const [selectedNodeId, setSelectedNodeId] = useState('')
  const [includeDescendants, setIncludeDescendants] = useState(true)

  useEffect(() => {
    setScopeType('organization')
    setSelectedNodeId('')
    setIncludeDescendants(true)
  }, [isOpen, title])

  const modalVariables = {
    '--modal-accent': theme.accentColor,
    '--modal-action': theme.actionColor,
    '--modal-on-action': theme.onActionColor,
    '--modal-card': theme.cardBg,
    '--modal-surface': theme.panelBg,
    '--modal-text': theme.textColor,
    '--modal-muted': theme.subtextColor,
    '--modal-border': theme.borderColor,
    '--modal-input': theme.inputBg,
    '--modal-divider': theme.dividerColor,
    '--modal-danger': theme.dangerColor,
  } as CSSProperties
  const palette = {
    accentColor: theme.accentColor,
    borderColor: theme.borderColor,
    inputBg: theme.inputBg,
    menuBg: theme.cardBg,
    mutedText: theme.subtextColor,
    onPrimaryColor: theme.onActionColor,
    primaryColor: theme.actionColor,
    surfaceColor: theme.panelBg,
    textColor: theme.textColor,
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className={modalStyles.overlay} onClick={onClose}>
        <motion.div className={modalStyles.backdrop} animate={{ opacity: 1 }} exit={{ opacity: 0 }} initial={{ opacity: 0 }} />
        <motion.section
          aria-labelledby="content-default-title"
          aria-modal="true"
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className={`${modalStyles.dialog} ${modalStyles.dialogMedium}`}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          initial={{ opacity: 0, scale: 0.96, y: 18 }}
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          style={modalVariables}
        >
          <header className={modalStyles.header}>
            <div className={modalStyles.headerIcon}><Sparkles aria-hidden="true" /></div>
            <div className={modalStyles.headerCopy}>
              <p className={modalStyles.eyebrow}>{labels.title}</p>
              <h2 className={modalStyles.title} id="content-default-title">{title}</h2>
              <p className={modalStyles.description}>Automatiza la asignación futura sin perder control sobre el alcance.</p>
            </div>
            <button aria-label="Cerrar reglas predeterminadas" className={modalStyles.closeButton} onClick={onClose} type="button">
              <X aria-hidden="true" />
            </button>
          </header>

          <div className={modalStyles.defaultBody}>
            <div className={modalStyles.defaultEditor}>
              <div className={modalStyles.defaultSectionHeader}>
                <span>01</span>
                <div>
                  <strong>Define el alcance</strong>
                  <p>Decide quién recibirá automáticamente este contenido.</p>
                </div>
              </div>
              <div className={modalStyles.scopeTabs}>
                {(['organization', 'node'] as const).map((mode) => (
                  <button
                    aria-pressed={scopeType === mode}
                    className={`${modalStyles.scopeTab} ${scopeType === mode ? modalStyles.scopeTabActive : ''}`}
                    key={mode}
                    onClick={() => setScopeType(mode)}
                    type="button"
                  >
                    <span className={modalStyles.scopeTabIcon} aria-hidden="true">
                      {mode === 'organization' ? <Building2 /> : <GitBranch />}
                    </span>
                    <span className={modalStyles.scopeTabCopy}>
                      <strong>{mode === 'organization' ? labels.scopeOrganization : labels.scopeNode}</strong>
                      <small>{mode === 'organization' ? 'Todos los integrantes activos' : 'Una rama de la organización'}</small>
                    </span>
                  </button>
                ))}
              </div>
              {scopeType === 'node' ? (
                <>
                  <label className={modalStyles.field}>
                    <span className={modalStyles.fieldLabel}>{labels.nodeLabel}</span>
                    <PremiumSelect
                      ariaLabel={labels.nodeLabel}
                      icon={GitBranch}
                      onChange={setSelectedNodeId}
                      options={hierarchyNodes.map((node) => ({
                        description: node.type,
                        label: `${'— '.repeat(Math.max(0, node.depth))}${node.name}`,
                        value: node.id,
                      }))}
                      palette={palette}
                      placeholder={labels.selectNode}
                      value={selectedNodeId}
                    />
                  </label>
                  <label className={modalStyles.checkbox}>
                    <input checked={includeDescendants} onChange={(event) => setIncludeDescendants(event.target.checked)} type="checkbox" />
                    {labels.includeDescendants}
                  </label>
                </>
              ) : (
                <p className={modalStyles.notice}>La regla se aplicará a toda la empresa y a futuras altas activas.</p>
              )}
              {scopeType === 'node' && !selectedNodeId ? <p className={modalStyles.description}>{labels.selectNodeError}</p> : null}
              {error ? <div className={modalStyles.errorNotice}>{error}</div> : null}
              <button
                className={modalStyles.primaryButton}
                disabled={isSaving || (scopeType === 'node' && !selectedNodeId)}
                onClick={() => void onCreate({
                  includeDescendants,
                  nodeId: scopeType === 'node' ? selectedNodeId : null,
                  scopeType,
                })}
                type="button"
              >
                {isSaving ? labels.saving : labels.saveAndApply}
              </button>
            </div>

            <div className={modalStyles.defaultRules}>
              <div className={modalStyles.defaultSectionHeader}>
                <span>02</span>
                <div>
                  <strong>Supervisa la automatización</strong>
                  <p>Consulta, aplica o revoca reglas sin perder trazabilidad.</p>
                </div>
              </div>
              <div className={modalStyles.rulesHeader}>
                <h3>{labels.activeRules}</h3>
                <button className={modalStyles.secondaryButton} disabled={isApplying || rules.length === 0} onClick={() => void onApply()} type="button">
                  {isApplying ? labels.applying : labels.applyNow}
                </button>
              </div>
              {rules.length === 0 ? (
                <div className={modalStyles.emptyNotice}>
                  <span className={modalStyles.emptyNoticeIcon} aria-hidden="true"><Sparkles /></span>
                  <strong>{labels.noRules}</strong>
                  <p>Guarda una regla para activar la asignación automática.</p>
                </div>
              ) : (
                <div className={modalStyles.rulesList}>
                  {rules.map((rule) => (
                    <article className={modalStyles.rule} key={rule.id}>
                      <div className={modalStyles.ruleIcon}>
                        {rule.scope_type === 'organization' ? <Route aria-hidden="true" /> : <GitBranch aria-hidden="true" />}
                      </div>
                      <div>
                        <strong>{rule.scope_type === 'organization' ? labels.wholeOrganization : rule.node?.name || labels.nodeFallback}</strong>
                        <span>
                          <CheckCircle2 aria-hidden="true" className="mr-1 inline h-3 w-3" />
                          {rule.scope_type === 'node' && rule.include_descendants ? labels.withDescendants : labels.directScope}
                          {' · '}
                          {labels.autoAssigns}
                        </span>
                      </div>
                      <button aria-label="Revocar regla" className={`${modalStyles.iconButton} ${modalStyles.iconButtonDanger}`} disabled={isSaving} onClick={() => void onRevoke(rule.id)} type="button">
                        <Trash2 aria-hidden="true" />
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.section>
      </div>
    </AnimatePresence>
  )
}
