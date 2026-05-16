'use client'

import {
  BookOpen,
  Check,
  Eye,
  EyeOff,
  Globe,
  Image as ImageIcon,
  Link2,
  Lock,
  Shield,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'

export interface AdminCommunityFormValues {
  access_type: 'open' | 'moderated' | 'invite_only'
  course_id?: string
  description: string
  image_url: string
  is_active: boolean
  name: string
  slug: string
  visibility: 'public' | 'private'
}

export type AdminCommunityFormErrors = Partial<
  Record<'name' | 'description' | 'slug', string>
>

export interface AdminCommunityCourseOption {
  id: string
  title: string
  instructor_name?: string | null
}

type FieldName = keyof AdminCommunityFormValues

interface AdminCommunityFormSectionsProps {
  courses?: AdminCommunityCourseOption[]
  errors?: AdminCommunityFormErrors
  formData: AdminCommunityFormValues
  isDisabled?: boolean
  isLoadingCourses?: boolean
  onFieldChange: <K extends FieldName>(
    field: K,
    value: AdminCommunityFormValues[K],
  ) => void
  showCourseField?: boolean
}

interface SectionPanelProps {
  children: React.ReactNode
  description: string
  icon: LucideIcon
  title: string
  tone: 'primary' | 'accent' | 'success' | 'muted'
}

interface FieldShellProps {
  children: React.ReactNode
  error?: string
  label: string
  required?: boolean
}

const visibilityOptions = ['public', 'private'] as const
const accessOptions = ['open', 'moderated', 'invite_only'] as const

function SectionPanel({
  children,
  description,
  icon: Icon,
  title,
  tone,
}: SectionPanelProps) {
  const theme = useAdminPanelTheme()
  const toneColor =
    tone === 'accent'
      ? theme.accentColor
      : tone === 'success'
        ? theme.successColor
        : tone === 'muted'
          ? theme.subtextColor
          : theme.primaryColor

  return (
    <section
      className="rounded-2xl border p-5"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.borderColor,
      }}
    >
      <div className="mb-5 flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${toneColor}14`, color: toneColor }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold" style={{ color: theme.textColor }}>
            {title}
          </h4>
          <p
            className="mt-1 text-xs leading-relaxed"
            style={{ color: theme.subtextColor }}
          >
            {description}
          </p>
        </div>
      </div>
      {children}
    </section>
  )
}

function FieldShell({ children, error, label, required }: FieldShellProps) {
  const theme = useAdminPanelTheme()

  return (
    <div className="space-y-2">
      <label
        className="block text-xs font-semibold uppercase tracking-wide"
        style={{ color: theme.mutedTextColor }}
      >
        {label}
        {required ? <span style={{ color: theme.accentColor }}> *</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium" style={{ color: theme.dangerColor }}>
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function AdminCommunityFormSections({
  courses = [],
  errors = {},
  formData,
  isDisabled = false,
  isLoadingCourses = false,
  onFieldChange,
  showCourseField = false,
}: AdminCommunityFormSectionsProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()

  const fieldStyle = (hasError = false) => ({
    backgroundColor: theme.inputBg,
    borderColor: hasError ? theme.dangerColor : theme.borderColor,
    color: theme.textColor,
  })

  const iconStyle = { color: theme.subtextColor }

  return (
    <div className="space-y-5">
      <SectionPanel
        description={t('communities.form.identityDescription')}
        icon={Users}
        title={t('communities.form.identityTitle')}
        tone="primary"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FieldShell
            error={errors.name}
            label={t('communities.form.nameLabel')}
            required
          >
            <div className="relative">
              <Users
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                style={iconStyle}
              />
              <input
                className="w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-all duration-200"
                disabled={isDisabled}
                onChange={(event) => onFieldChange('name', event.target.value)}
                placeholder={t('communities.form.namePlaceholder')}
                style={fieldStyle(Boolean(errors.name))}
                value={formData.name}
              />
            </div>
          </FieldShell>

          <FieldShell
            error={errors.slug}
            label={t('communities.form.slugLabel')}
            required
          >
            <div className="relative">
              <Link2
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                style={iconStyle}
              />
              <input
                className="w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-all duration-200"
                disabled={isDisabled}
                onChange={(event) => onFieldChange('slug', event.target.value)}
                placeholder={t('communities.form.slugPlaceholder')}
                style={fieldStyle(Boolean(errors.slug))}
                value={formData.slug}
              />
            </div>
          </FieldShell>
        </div>

        <div className="mt-4">
          <FieldShell
            error={errors.description}
            label={t('communities.form.descriptionLabel')}
            required
          >
            <textarea
              className="min-h-[112px] w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-200"
              disabled={isDisabled}
              onChange={(event) =>
                onFieldChange('description', event.target.value)
              }
              placeholder={t('communities.form.descriptionPlaceholder')}
              style={fieldStyle(Boolean(errors.description))}
              value={formData.description}
            />
          </FieldShell>
        </div>

        <div className="mt-4">
          <FieldShell label={t('communities.form.imageUrlLabel')}>
            <div className="relative">
              <ImageIcon
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                style={iconStyle}
              />
              <input
                className="w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-all duration-200"
                disabled={isDisabled}
                onChange={(event) =>
                  onFieldChange('image_url', event.target.value)
                }
                placeholder={t('communities.form.imageUrlPlaceholder')}
                style={fieldStyle()}
                type="url"
                value={formData.image_url}
              />
            </div>
          </FieldShell>

          {formData.image_url ? (
            <div
              className="mt-3 overflow-hidden rounded-xl border p-3"
              style={{
                backgroundColor: theme.inputBg,
                borderColor: theme.borderColor,
              }}
            >
              <p
                className="mb-2 text-xs font-semibold"
                style={{ color: theme.subtextColor }}
              >
                {t('communities.form.imagePreview')}
              </p>
              <img
                alt={t('communities.form.imagePreviewAlt')}
                className="h-28 w-full rounded-lg object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = 'none'
                }}
                src={formData.image_url}
              />
            </div>
          ) : null}
        </div>
      </SectionPanel>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionPanel
          description={t('communities.form.accessDescription')}
          icon={Shield}
          title={t('communities.form.accessTitle')}
          tone="accent"
        >
          <div className="space-y-4">
            <FieldShell label={t('communities.form.visibilityLabel')} required>
              <div className="relative">
                <Globe
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={iconStyle}
                />
                <select
                  className="w-full appearance-none rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-all duration-200"
                  disabled={isDisabled}
                  onChange={(event) =>
                    onFieldChange(
                      'visibility',
                      event.target
                        .value as AdminCommunityFormValues['visibility'],
                    )
                  }
                  style={fieldStyle()}
                  value={formData.visibility}
                >
                  {visibilityOptions.map((option) => (
                    <option key={option} value={option}>
                      {t(`communities.form.visibilityOptions.${option}`)}
                    </option>
                  ))}
                </select>
              </div>
            </FieldShell>

            <FieldShell label={t('communities.form.accessTypeLabel')} required>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={iconStyle}
                />
                <select
                  className="w-full appearance-none rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-all duration-200"
                  disabled={isDisabled}
                  onChange={(event) =>
                    onFieldChange(
                      'access_type',
                      event.target
                        .value as AdminCommunityFormValues['access_type'],
                    )
                  }
                  style={fieldStyle()}
                  value={formData.access_type}
                >
                  {accessOptions.map((option) => (
                    <option key={option} value={option}>
                      {t(`communities.form.accessOptions.${option}`)}
                    </option>
                  ))}
                </select>
              </div>
            </FieldShell>

            {showCourseField ? (
              <FieldShell label={t('communities.form.courseLabel')}>
                <div className="relative">
                  <BookOpen
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                    style={iconStyle}
                  />
                  <select
                    className="w-full appearance-none rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-all duration-200"
                    disabled={isDisabled || isLoadingCourses}
                    onChange={(event) =>
                      onFieldChange('course_id', event.target.value)
                    }
                    style={fieldStyle()}
                    value={formData.course_id ?? ''}
                  >
                    <option value="">
                      {t('communities.form.coursePlaceholder')}
                    </option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.instructor_name
                          ? t('communities.form.courseWithInstructor', {
                              instructor: course.instructor_name,
                              title: course.title,
                            })
                          : course.title}
                      </option>
                    ))}
                  </select>
                </div>
                {isLoadingCourses ? (
                  <p className="text-xs" style={{ color: theme.subtextColor }}>
                    {t('communities.form.loadingCourses')}
                  </p>
                ) : null}
              </FieldShell>
            ) : null}
          </div>
        </SectionPanel>

        <SectionPanel
          description={t('communities.form.statusDescription')}
          icon={formData.is_active ? Eye : EyeOff}
          title={t('communities.form.statusTitle')}
          tone={formData.is_active ? 'success' : 'muted'}
        >
          <motion.label
            className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border p-4"
            style={{
              backgroundColor: formData.is_active
                ? `${theme.successColor}14`
                : theme.inputBg,
              borderColor: formData.is_active
                ? `${theme.successColor}26`
                : theme.borderColor,
            }}
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: formData.is_active
                    ? `${theme.successColor}20`
                    : theme.actionSurface,
                  color: formData.is_active
                    ? theme.successColor
                    : theme.subtextColor,
                }}
              >
                {formData.is_active ? (
                  <Eye className="h-5 w-5" />
                ) : (
                  <EyeOff className="h-5 w-5" />
                )}
              </div>
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: theme.textColor }}
                >
                  {formData.is_active
                    ? t('communities.form.activeTitle')
                    : t('communities.form.inactiveTitle')}
                </p>
                <p className="mt-0.5 text-xs" style={{ color: theme.subtextColor }}>
                  {formData.is_active
                    ? t('communities.form.activeDescription')
                    : t('communities.form.inactiveDescription')}
                </p>
              </div>
            </div>

            <input
              checked={formData.is_active}
              className="sr-only"
              disabled={isDisabled}
              onChange={(event) =>
                onFieldChange('is_active', event.target.checked)
              }
              type="checkbox"
            />
            <span
              className="relative flex h-8 w-14 shrink-0 items-center rounded-full p-1 transition-colors"
              style={{
                backgroundColor: formData.is_active
                  ? theme.successColor
                  : theme.borderColor,
              }}
            >
              <motion.span
                animate={{ x: formData.is_active ? 24 : 0 }}
                className="flex h-6 w-6 items-center justify-center rounded-full shadow-lg"
                style={{ backgroundColor: theme.cardBg }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                {formData.is_active ? (
                  <Check
                    className="h-3.5 w-3.5"
                    style={{ color: theme.successColor }}
                  />
                ) : null}
              </motion.span>
            </span>
          </motion.label>
        </SectionPanel>
      </div>
    </div>
  )
}
