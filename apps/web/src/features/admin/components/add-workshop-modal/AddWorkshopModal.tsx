'use client'

import dynamic from 'next/dynamic'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BookOpen,
  CheckCircle,
  Clock,
  DollarSign,
  Image as ImageIcon,
  Link,
  Plus,
  Tag,
  UserCircle,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import { useAddWorkshopFormState } from './useAddWorkshopFormState'

interface AddWorkshopModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => Promise<void>
}

type TabType = 'basic' | 'details' | 'media'

const AddWorkshopMediaTab = dynamic(
  () =>
    import('./AddWorkshopMediaTab').then((module) => ({
      default: module.AddWorkshopMediaTab,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-40 animate-pulse rounded-xl border border-[var(--color-gray-200)] bg-[var(--color-gray-100)] dark:border-white/10 dark:bg-white/5" />
    ),
  },
)

const tabs: { id: TabType; labelKey: string; icon: LucideIcon }[] = [
  { id: 'basic', labelKey: 'workshops.addModal.tabs.basic', icon: BookOpen },
  { id: 'details', labelKey: 'workshops.addModal.tabs.details', icon: Tag },
  { id: 'media', labelKey: 'workshops.addModal.tabs.media', icon: ImageIcon },
]

const categoryOptions = ['ia', 'tecnologia', 'negocios', 'diseno', 'marketing']
const levelOptions = ['beginner', 'intermediate', 'advanced']

export function AddWorkshopModal({
  isOpen,
  onClose,
  onSave,
}: AddWorkshopModalProps) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const theme = useAdminPanelTheme()
  const {
    formData,
    setFormData,
    instructors,
    isLoading,
    error,
    errors,
    activeTab,
    setActiveTab,
    handleChange,
    handleSubmit,
  } = useAddWorkshopFormState({ isOpen, onSave, onClose })

  if (!isOpen) return null

  const fieldStyle = (hasError = false) => ({
    backgroundColor: theme.inputBg,
    borderColor: hasError ? theme.dangerColor : theme.borderColor,
    color: theme.textColor,
  })

  const labelStyle = { color: theme.mutedTextColor }
  const iconStyle = { color: theme.subtextColor }

  return (
    <AnimatePresence>
      {isOpen && (
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
                        <Plus
                          className="h-5 w-5"
                          style={{ color: theme.accentColor }}
                        />
                      </div>
                      <div>
                        <h3
                          className="text-lg font-bold"
                          style={{ color: theme.inverseTextColor }}
                        >
                          {t('workshops.addModal.title')}
                        </h3>
                        <p
                          className="text-xs"
                          style={{ color: theme.inverseSubtextColor }}
                        >
                          {t('workshops.addModal.description')}
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
                            layoutId="add-workshop-active-tab"
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
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 rounded-xl border p-4"
                        style={{
                          backgroundColor: `${theme.dangerColor}14`,
                          borderColor: `${theme.dangerColor}26`,
                        }}
                      >
                        <p
                          className="text-sm"
                          style={{ color: theme.dangerColor }}
                        >
                          {error}
                        </p>
                      </motion.div>
                    )}

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
                          <div className="group">
                            <label
                              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide"
                              style={labelStyle}
                            >
                              {t('workshops.editor.config.titleLabel')}
                            </label>
                            <div className="relative">
                              <BookOpen
                                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                                style={iconStyle}
                              />
                              <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-all duration-200"
                                style={fieldStyle(Boolean(errors.title))}
                                placeholder={t(
                                  'workshops.addModal.titlePlaceholder',
                                )}
                                required
                              />
                            </div>
                            {errors.title && (
                              <p
                                className="mt-1 text-xs"
                                style={{ color: theme.dangerColor }}
                              >
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
                              name="description"
                              value={formData.description}
                              onChange={handleChange}
                              rows={4}
                              className="w-full resize-none rounded-xl border px-4 py-2.5 text-sm outline-none transition-all duration-200"
                              style={fieldStyle(Boolean(errors.description))}
                              placeholder={t(
                                'workshops.addModal.descriptionPlaceholder',
                              )}
                              required
                            />
                            {errors.description && (
                              <p
                                className="mt-1 text-xs"
                                style={{ color: theme.dangerColor }}
                              >
                                {errors.description}
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="group">
                              <label
                                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide"
                                style={labelStyle}
                              >
                                {t('workshops.editor.config.instructorLabel')}
                              </label>
                              <div className="relative">
                                <UserCircle
                                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                                  style={iconStyle}
                                />
                                <select
                                  name="instructor_id"
                                  value={formData.instructor_id}
                                  onChange={handleChange}
                                  className="w-full cursor-pointer appearance-none rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-all duration-200"
                                  style={fieldStyle(Boolean(errors.instructor_id))}
                                  required
                                >
                                  <option value="">
                                    {t(
                                      'workshops.editor.config.instructorPlaceholder',
                                    )}
                                  </option>
                                  {instructors.map((instructor) => (
                                    <option
                                      key={instructor.id}
                                      value={instructor.id}
                                    >
                                      {instructor.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              {errors.instructor_id && (
                                <p
                                  className="mt-1 text-xs"
                                  style={{ color: theme.dangerColor }}
                                >
                                  {errors.instructor_id}
                                </p>
                              )}
                            </div>

                            <div className="group">
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
                                  name="duration_total_minutes"
                                  value={formData.duration_total_minutes}
                                  onChange={handleChange}
                                  min="1"
                                  className="w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-all duration-200"
                                  style={fieldStyle(
                                    Boolean(errors.duration_total_minutes),
                                  )}
                                  required
                                />
                              </div>
                              {errors.duration_total_minutes && (
                                <p
                                  className="mt-1 text-xs"
                                  style={{ color: theme.dangerColor }}
                                >
                                  {errors.duration_total_minutes}
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {activeTab === 'details' && (
                        <motion.div
                          key="details"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                              <label
                                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide"
                                style={labelStyle}
                              >
                                {t('workshops.editor.config.categoryLabel')}
                              </label>
                              <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
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
                                name="level"
                                value={formData.level}
                                onChange={handleChange}
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
                            <div className="group">
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
                                  name="price"
                                  value={formData.price}
                                  onChange={handleChange}
                                  min="0"
                                  step="0.01"
                                  className="w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-all duration-200"
                                  style={fieldStyle()}
                                  placeholder="0.00"
                                />
                              </div>
                            </div>

                            <div>
                              <label
                                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide"
                                style={labelStyle}
                              >
                                {t('workshops.editor.config.slugLabel')}
                              </label>
                              <div className="relative">
                                <Link
                                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                                  style={iconStyle}
                                />
                                <input
                                  type="text"
                                  name="slug"
                                  value={formData.slug}
                                  onChange={handleChange}
                                  className="w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-all duration-200"
                                  style={fieldStyle(Boolean(errors.slug))}
                                  placeholder={t(
                                    'workshops.addModal.slugPlaceholder',
                                  )}
                                  required
                                />
                              </div>
                              {errors.slug && (
                                <p
                                  className="mt-1 text-xs"
                                  style={{ color: theme.dangerColor }}
                                >
                                  {errors.slug}
                                </p>
                              )}
                            </div>
                          </div>

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
                                  name="is_active"
                                  checked={formData.is_active}
                                  onChange={handleChange}
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
                                  {t('workshops.addModal.activeTitle')}
                                </span>
                                <p
                                  className="mt-0.5 text-xs"
                                  style={{ color: theme.subtextColor }}
                                >
                                  {t('workshops.addModal.activeDescription')}
                                </p>
                              </div>
                            </label>
                          </motion.div>
                        </motion.div>
                      )}

                      {activeTab === 'media' && (
                        <motion.div
                          key="media"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4"
                        >
                          <AddWorkshopMediaTab
                            thumbnailUrl={formData.thumbnail_url}
                            onThumbnailChange={(url) =>
                              setFormData((prev) => ({
                                ...prev,
                                thumbnail_url: url,
                              }))
                            }
                            disabled={isLoading}
                          />
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
                      disabled={isLoading}
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
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <div
                            className="h-4 w-4 animate-spin rounded-full border-2"
                            style={{
                              borderColor: theme.inverseBorderColor,
                              borderTopColor: theme.onPrimaryColor,
                            }}
                          />
                          <span>{t('workshops.addModal.creating')}</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          <span>{t('workshops.addModal.createButton')}</span>
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
