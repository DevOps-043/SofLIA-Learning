'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  BookOpen,
  CheckCircle,
  Clock,
  DollarSign,
  ShieldCheck,
  Tag,
  X,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../hooks/useAdminPanelTheme'
import { AdminWorkshop } from '../services/adminWorkshops.service'

interface EditWorkshopModalProps {
  workshop: AdminWorkshop | null
  onClose: () => void
  onSave: (data: Partial<AdminWorkshop>) => Promise<void>
}

type TabType = 'basic' | 'status'

const categoryOptions = ['ia', 'tecnologia', 'negocios', 'diseno', 'marketing']
const levelOptions = ['beginner', 'intermediate', 'advanced']
const tabs: { id: TabType; labelKey: string; icon: LucideIcon }[] = [
  { id: 'basic', labelKey: 'workshops.editModal.tabs.basic', icon: BookOpen },
  { id: 'status', labelKey: 'workshops.editModal.tabs.status', icon: ShieldCheck },
]

function normalizeWorkshopCategory(category?: string | null) {
  return category === 'diseño' ? 'diseno' : category || 'ia'
}

export function EditWorkshopModal({
  workshop,
  onClose,
  onSave,
}: EditWorkshopModalProps) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const theme = useAdminPanelTheme()
  const [formData, setFormData] = useState<Partial<AdminWorkshop>>({
    title: '',
    description: '',
    category: 'ia',
    level: 'beginner',
    duration_total_minutes: 0,
    price: 0,
    is_active: true,
    approval_status: 'pending',
    rejection_reason: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saveError, setSaveError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('basic')

  useEffect(() => {
    if (workshop) {
      setFormData({
        title: workshop.title || '',
        description: workshop.description || '',
        category: normalizeWorkshopCategory(workshop.category),
        level: workshop.level || 'beginner',
        duration_total_minutes: workshop.duration_total_minutes || 0,
        price: workshop.price || 0,
        is_active: workshop.is_active !== undefined ? workshop.is_active : true,
        approval_status: workshop.approval_status || 'pending',
        rejection_reason: workshop.rejection_reason || '',
      })
      setErrors({})
      setSaveError(null)
      setActiveTab('basic')
    }
  }, [workshop])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title || formData.title.trim() === '') {
      newErrors.title = t('workshops.editModal.validation.titleRequired')
    }

    if (!formData.description || formData.description.trim() === '') {
      newErrors.description = t(
        'workshops.editModal.validation.descriptionRequired',
      )
    }

    if (
      !formData.duration_total_minutes ||
      formData.duration_total_minutes <= 0
    ) {
      newErrors.duration_total_minutes = t(
        'workshops.editModal.validation.durationRequired',
      )
    }

    if (
      formData.approval_status === 'rejected' &&
      (!formData.rejection_reason || formData.rejection_reason.trim() === '')
    ) {
      newErrors.rejection_reason = t(
        'workshops.editModal.validation.rejectionReasonRequired',
      )
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setSaveError(null)

    try {
      const dataToSave = { ...formData }
      if (formData.approval_status !== 'rejected') {
        dataToSave.rejection_reason = ''
      }

      await onSave(dataToSave)
      onClose()
    } catch {
      setSaveError(t('workshops.editModal.saveError'))
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = <K extends keyof AdminWorkshop>(
    field: K,
    value: AdminWorkshop[K],
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  if (!workshop) return null

  const fieldStyle = (hasError = false) => ({
    backgroundColor: theme.inputBg,
    borderColor: hasError ? theme.dangerColor : theme.borderColor,
    color: theme.textColor,
  })
  const labelStyle = { color: theme.mutedTextColor }
  const iconStyle = { color: theme.subtextColor }
  const approvalStatuses = [
    {
      value: 'pending',
      labelKey: 'workshops.editModal.approval.pending',
      icon: AlertTriangle,
      color: theme.warningColor,
    },
    {
      value: 'approved',
      labelKey: 'workshops.editModal.approval.approved',
      icon: CheckCircle,
      color: theme.successColor,
    },
    {
      value: 'rejected',
      labelKey: 'workshops.editModal.approval.rejected',
      icon: XCircle,
      color: theme.dangerColor,
    },
  ] as const
  const currentApprovalStatus =
    approvalStatuses.find(
      (status) => status.value === formData.approval_status,
    ) ?? approvalStatuses[0]
  const ApprovalIcon = currentApprovalStatus.icon

  return (
    <AnimatePresence>
      {workshop && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 backdrop-blur-sm"
            style={{ backgroundColor: theme.overlayBg }}
            onClick={onClose}
          />

          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border shadow-2xl"
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: theme.borderColor,
                }}
                onClick={(event) => event.stopPropagation()}
              >
                <div
                  className="relative border-b px-6 py-4"
                  style={{
                    background: theme.heroBackground,
                    borderColor: theme.heroBorderColor,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ backgroundColor: theme.inverseSurface }}
                      >
                        <BookOpen
                          className="h-5 w-5"
                          style={{ color: theme.accentColor }}
                        />
                      </div>
                      <div>
                        <h3
                          className="text-lg font-bold"
                          style={{ color: theme.inverseTextColor }}
                        >
                          {t('workshops.editModal.title')}
                        </h3>
                        <p
                          className="text-xs"
                          style={{ color: theme.inverseSubtextColor }}
                        >
                          {workshop.title}
                        </p>
                      </div>
                    </div>
                    <motion.button
                      onClick={onClose}
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      className="rounded-lg p-2 transition-colors duration-200"
                      style={{ color: theme.inverseSubtextColor }}
                      type="button"
                    >
                      <X className="h-5 w-5" />
                    </motion.button>
                  </div>
                </div>

                <div
                  className="flex items-center gap-1 border-b px-6 py-3"
                  style={{
                    backgroundColor: theme.inputBg,
                    borderColor: theme.borderColor,
                  }}
                >
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id

                    return (
                      <motion.button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200"
                        style={{
                          backgroundColor: isActive
                            ? theme.actionSurface
                            : 'transparent',
                          color: isActive ? theme.primaryColor : theme.subtextColor,
                        }}
                        type="button"
                      >
                        <Icon className="h-4 w-4" />
                        <span>{t(tab.labelKey)}</span>
                        {isActive && (
                          <motion.div
                            layoutId="edit-workshop-active-tab"
                            className="absolute inset-0 -z-10 rounded-xl"
                            style={{ backgroundColor: theme.actionSurface }}
                            transition={{
                              type: 'spring',
                              stiffness: 500,
                              damping: 30,
                            }}
                          />
                        )}
                      </motion.button>
                    )
                  })}
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                  <div className="p-6">
                    <AnimatePresence mode="wait">
                      {activeTab === 'basic' && (
                        <motion.div
                          key="basic"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4"
                        >
                          <div>
                            <label
                              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide"
                              style={labelStyle}
                            >
                              {t('workshops.editor.config.titleLabel')}
                            </label>
                            <input
                              type="text"
                              value={formData.title}
                              onChange={(event) =>
                                handleInputChange('title', event.target.value)
                              }
                              className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all duration-200"
                              style={fieldStyle(Boolean(errors.title))}
                              placeholder={t(
                                'workshops.addModal.titlePlaceholder',
                              )}
                            />
                            {errors.title && (
                              <p
                                className="mt-1 flex items-center gap-1 text-xs"
                                style={{ color: theme.dangerColor }}
                              >
                                <AlertTriangle className="h-3 w-3" />
                                {errors.title}
                              </p>
                            )}
                          </div>

                          <div>
                            <label
                              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide"
                              style={labelStyle}
                            >
                              {t('workshops.editor.config.descriptionLabel')}
                            </label>
                            <textarea
                              value={formData.description}
                              onChange={(event) =>
                                handleInputChange(
                                  'description',
                                  event.target.value,
                                )
                              }
                              rows={4}
                              className="w-full resize-none rounded-xl border px-4 py-2.5 text-sm outline-none transition-all duration-200"
                              style={fieldStyle(Boolean(errors.description))}
                              placeholder={t(
                                'workshops.addModal.descriptionPlaceholder',
                              )}
                            />
                            {errors.description && (
                              <p
                                className="mt-1 flex items-center gap-1 text-xs"
                                style={{ color: theme.dangerColor }}
                              >
                                <AlertTriangle className="h-3 w-3" />
                                {errors.description}
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                              <label
                                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide"
                                style={labelStyle}
                              >
                                {t('workshops.editor.config.categoryLabel')}
                              </label>
                              <select
                                value={formData.category}
                                onChange={(event) =>
                                  handleInputChange(
                                    'category',
                                    event.target.value,
                                  )
                                }
                                className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all duration-200"
                                style={fieldStyle()}
                              >
                                {categoryOptions.map((category) => (
                                  <option key={category} value={category}>
                                    {t(
                                      `workshops.filters.categories.${category}`,
                                    )}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label
                                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide"
                                style={labelStyle}
                              >
                                {t('workshops.editor.config.levelLabel')}
                              </label>
                              <select
                                value={formData.level}
                                onChange={(event) =>
                                  handleInputChange('level', event.target.value)
                                }
                                className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all duration-200"
                                style={fieldStyle()}
                              >
                                {levelOptions.map((level) => (
                                  <option key={level} value={level}>
                                    {t(`workshops.card.level.${level}`)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                              <label
                                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide"
                                style={labelStyle}
                              >
                                {t('workshops.editor.config.durationLabel')}
                              </label>
                              <div className="relative">
                                <Clock
                                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                                  style={iconStyle}
                                />
                                <input
                                  type="number"
                                  min="0"
                                  value={formData.duration_total_minutes}
                                  onChange={(event) =>
                                    handleInputChange(
                                      'duration_total_minutes',
                                      parseInt(event.target.value, 10) || 0,
                                    )
                                  }
                                  className="w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-all duration-200"
                                  style={fieldStyle(
                                    Boolean(errors.duration_total_minutes),
                                  )}
                                />
                              </div>
                              {errors.duration_total_minutes && (
                                <p
                                  className="mt-1 flex items-center gap-1 text-xs"
                                  style={{ color: theme.dangerColor }}
                                >
                                  <AlertTriangle className="h-3 w-3" />
                                  {errors.duration_total_minutes}
                                </p>
                              )}
                            </div>

                            <div>
                              <label
                                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide"
                                style={labelStyle}
                              >
                                {t('workshops.editor.config.priceLabel')}
                              </label>
                              <div className="relative">
                                <DollarSign
                                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                                  style={iconStyle}
                                />
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={formData.price}
                                  onChange={(event) =>
                                    handleInputChange(
                                      'price',
                                      parseFloat(event.target.value) || 0,
                                    )
                                  }
                                  className="w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-all duration-200"
                                  style={fieldStyle()}
                                />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {activeTab === 'status' && (
                        <motion.div
                          key="status"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4"
                        >
                          <motion.div
                            whileHover={{ scale: 1.01 }}
                            className="rounded-xl border p-4"
                            style={{
                              backgroundColor: theme.inputBg,
                              borderColor: theme.borderColor,
                            }}
                          >
                            <label className="flex cursor-pointer items-center gap-3">
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  checked={Boolean(formData.is_active)}
                                  onChange={(event) =>
                                    handleInputChange(
                                      'is_active',
                                      event.target.checked,
                                    )
                                  }
                                  className="sr-only"
                                />
                                <motion.div
                                  animate={{
                                    backgroundColor: formData.is_active
                                      ? theme.accentColor
                                      : theme.inputBg,
                                    borderColor: formData.is_active
                                      ? theme.accentColor
                                      : theme.borderColor,
                                  }}
                                  className="flex h-5 w-5 items-center justify-center rounded border-2 transition-colors duration-200"
                                >
                                  {formData.is_active && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{
                                        type: 'spring',
                                        stiffness: 500,
                                        damping: 30,
                                      }}
                                    >
                                      <CheckCircle
                                        className="h-4 w-4"
                                        style={{ color: theme.onPrimaryColor }}
                                      />
                                    </motion.div>
                                  )}
                                </motion.div>
                              </div>
                              <div>
                                <span
                                  className="text-sm font-semibold"
                                  style={{ color: theme.textColor }}
                                >
                                  {formData.is_active
                                    ? t('workshops.editModal.activeTitle')
                                    : t('workshops.editModal.inactiveTitle')}
                                </span>
                                <p
                                  className="mt-0.5 text-xs"
                                  style={{ color: theme.subtextColor }}
                                >
                                  {formData.is_active
                                    ? t('workshops.editModal.activeDescription')
                                    : t(
                                        'workshops.editModal.inactiveDescription',
                                      )}
                                </p>
                              </div>
                            </label>
                          </motion.div>

                          <div>
                            <label
                              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide"
                              style={labelStyle}
                            >
                              {t('workshops.editModal.approvalStatusLabel')}
                            </label>
                            <select
                              value={formData.approval_status}
                              onChange={(event) =>
                                handleInputChange(
                                  'approval_status',
                                  event.target
                                    .value as AdminWorkshop['approval_status'],
                                )
                              }
                              className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all duration-200"
                              style={fieldStyle()}
                            >
                              {approvalStatuses.map((status) => (
                                <option key={status.value} value={status.value}>
                                  {t(status.labelKey)}
                                </option>
                              ))}
                            </select>
                            <div className="mt-2 flex items-center gap-2">
                              <div
                                className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5"
                                style={{
                                  backgroundColor: `${currentApprovalStatus.color}14`,
                                  borderColor: `${currentApprovalStatus.color}26`,
                                  color: currentApprovalStatus.color,
                                }}
                              >
                                <ApprovalIcon className="h-4 w-4" />
                                <span className="text-xs font-semibold">
                                  {t(currentApprovalStatus.labelKey)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {formData.approval_status === 'rejected' && (
                            <div>
                              <label
                                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide"
                                style={labelStyle}
                              >
                                {t('workshops.editModal.rejectionReasonLabel')}
                              </label>
                              <textarea
                                value={formData.rejection_reason}
                                onChange={(event) =>
                                  handleInputChange(
                                    'rejection_reason',
                                    event.target.value,
                                  )
                                }
                                rows={3}
                                className="w-full resize-none rounded-xl border px-4 py-2.5 text-sm outline-none transition-all duration-200"
                                style={fieldStyle(
                                  Boolean(errors.rejection_reason),
                                )}
                                placeholder={t(
                                  'workshops.editModal.rejectionReasonPlaceholder',
                                )}
                              />
                              {errors.rejection_reason ? (
                                <p
                                  className="mt-1 flex items-center gap-1 text-xs"
                                  style={{ color: theme.dangerColor }}
                                >
                                  <AlertTriangle className="h-3 w-3" />
                                  {errors.rejection_reason}
                                </p>
                              ) : (
                                <p
                                  className="mt-1 text-xs"
                                  style={{ color: theme.subtextColor }}
                                >
                                  {t('workshops.editModal.rejectionReasonHelp')}
                                </p>
                              )}
                            </div>
                          )}

                          {formData.approval_status === 'approved' &&
                            workshop.approved_at && (
                              <div
                                className="rounded-xl border p-4"
                                style={{
                                  backgroundColor: `${theme.successColor}14`,
                                  borderColor: `${theme.successColor}26`,
                                }}
                              >
                                <p
                                  className="text-sm"
                                  style={{ color: theme.successColor }}
                                >
                                  <strong>
                                    {t('workshops.editModal.approvedAt')}:
                                  </strong>{' '}
                                  {new Date(
                                    workshop.approved_at,
                                  ).toLocaleString()}
                                </p>
                                {workshop.approved_by && (
                                  <p
                                    className="mt-1 text-xs"
                                    style={{ color: theme.successColor }}
                                  >
                                    {t('workshops.editModal.approvedBy')}:{' '}
                                    {workshop.approved_by}
                                  </p>
                                )}
                              </div>
                            )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div
                    className="flex items-center justify-end gap-3 border-t px-6 py-4"
                    style={{
                      backgroundColor: theme.inputBg,
                      borderColor: theme.borderColor,
                    }}
                  >
                    {saveError && (
                      <p
                        className="mr-auto text-xs"
                        style={{ color: theme.dangerColor }}
                      >
                        {saveError}
                      </p>
                    )}
                    <motion.button
                      type="button"
                      onClick={onClose}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="rounded-xl border px-6 py-2.5 text-sm font-semibold transition-colors duration-200"
                      style={{
                        backgroundColor: theme.cardBg,
                        borderColor: theme.borderColor,
                        color: theme.subtextColor,
                      }}
                      disabled={loading}
                    >
                      {tc('actions.cancel')}
                    </motion.button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold shadow-lg transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50"
                      style={{
                        backgroundColor: theme.primaryColor,
                        color: theme.onPrimaryColor,
                      }}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <div
                            className="h-4 w-4 animate-spin rounded-full border-2"
                            style={{
                              borderColor: theme.inverseBorderColor,
                              borderTopColor: theme.onPrimaryColor,
                            }}
                          />
                          <span>{tc('actions.saving')}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          <span>{tc('actions.saveChanges')}</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
