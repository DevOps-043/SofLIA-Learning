'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Building2,
  Globe,
  Mail,
  Pencil,
  Phone,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import type { AdminCompany, AdminCompanyMember } from '../../types/admin-companies.types'
import {
  getAdminCompanyPlanColor,
  getAdminCompanyPlanKey,
  getAdminCompanyStatusDisplayConfig,
  getCompanyUsagePercent,
  type AdminCompaniesThemeColors,
} from '../../services/admin-companies'

interface AdminCompanyViewModalProps {
  company: AdminCompany
  onClose: () => void
  onEdit: () => void
  themeColors: AdminCompaniesThemeColors
}

function getMemberDisplayName(member: AdminCompanyMember, fallback: string) {
  const user = member.user

  if (!user) return fallback
  if (user.display_name) return user.display_name
  if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`
  if (user.first_name) return user.first_name
  if (user.username) return user.username

  return user.email.split('@')[0] || fallback
}

export function AdminCompanyViewModal({
  company,
  onClose,
  onEdit,
  themeColors,
}: AdminCompanyViewModalProps) {
  const router = useRouter()
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const theme = useAdminPanelTheme()
  const status = getAdminCompanyStatusDisplayConfig(company, theme)
  const StatusIcon = status.icon
  const normalizedPlan = getAdminCompanyPlanKey(company.subscription_plan)
  const planColor = getAdminCompanyPlanColor(company.subscription_plan, theme)
  const owner = company.members?.find((member) => member.role === 'owner')
  const admins = company.members?.filter((member) => member.role === 'admin') || []
  const adminMembers = owner ? [owner, ...admins] : admins
  const logoUrl = company.brand_logo_url || company.logo_url
  const usagePercent = getCompanyUsagePercent(company)

  const handleNavigateToEdit = () => {
    onClose()
    router.push(`/admin/companies/${company.id}/edit`)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[99999] flex items-center justify-center overflow-y-auto p-4"
      style={{ backgroundColor: theme.overlayBg }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(event) => event.stopPropagation()}
        className="relative my-8 w-full max-w-3xl overflow-hidden rounded-[28px] border shadow-2xl"
        style={{
          backgroundColor: themeColors.cardBackground,
          borderColor: themeColors.borderColor,
        }}
      >
        <div
          className="relative h-44 border-b"
          style={{
            backgroundColor: themeColors.inputBg,
            backgroundImage: company.brand_banner_url ? `url(${company.brand_banner_url})` : theme.heroBackground,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderColor: themeColors.borderColor,
          }}
        >
          {!company.brand_banner_url ? (
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, ${theme.inverseTextColor} 1px, transparent 0)`,
                backgroundSize: '32px 32px',
              }}
            />
          ) : null}

          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl border backdrop-blur-xl"
            style={{
              backgroundColor: theme.inverseSurface,
              borderColor: theme.inverseBorderColor,
              color: theme.inverseTextColor,
            }}
            aria-label={tc('actions.close')}
          >
            <X className="h-5 w-5" />
          </button>

          <div className="absolute -bottom-12 left-6">
            <div
              className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-[24px] border-4 shadow-lg"
              style={{
                backgroundColor: themeColors.cardBackground,
                borderColor: themeColors.cardBackground,
                color: theme.primaryColor,
              }}
            >
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={company.name}
                  fill
                  sizes="96px"
                  className="object-contain p-3"
                  unoptimized
                />
              ) : (
                <Building2 className="h-12 w-12" />
              )}
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 pt-16">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-extrabold" style={{ color: themeColors.textPrimary }}>
                {company.name}
              </h2>
              <p className="mt-1 text-sm font-semibold" style={{ color: themeColors.textSecondary }}>
                /{company.slug || t('companies.card.noSlug')}
              </p>
              {company.description ? (
                <p className="mt-3 max-w-2xl text-sm leading-relaxed" style={{ color: themeColors.textSecondary }}>
                  {company.description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-bold"
              style={{
                backgroundColor: `${theme.primaryColor}14`,
                color: theme.primaryColor,
              }}
            >
              <Pencil className="h-4 w-4" />
              {t('companies.actions.edit')}
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-extrabold"
              style={{
                backgroundColor: status.bg,
                borderColor: `${status.color}26`,
                color: status.color,
              }}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {t(`companies.status.${status.key}`)}
            </span>
            <span
              className="rounded-xl border px-3 py-1.5 text-xs font-extrabold"
              style={{
                backgroundColor: `${planColor}14`,
                borderColor: `${planColor}26`,
                color: planColor,
              }}
            >
              {t('companies.card.plan', {
                plan: t(`companies.plans.${normalizedPlan}`, {
                  defaultValue: company.subscription_plan || t('companies.plans.none'),
                }),
              })}
            </span>
          </div>
        </div>

        <div className="grid gap-4 px-6 pb-6 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-[22px] border p-4" style={{ backgroundColor: themeColors.inputBg, borderColor: themeColors.borderColor }}>
            <h3 className="mb-4 text-xs font-extrabold uppercase tracking-widest" style={{ color: theme.primaryColor }}>
              {t('companies.modal.admins')}
            </h3>
            <div className="space-y-3">
              {adminMembers.length > 0 ? (
                adminMembers.map((member) => (
                  <AdminMemberRow
                    key={member.id}
                    member={member}
                    roleLabel={member.role === 'owner' ? t('companies.modal.roles.owner') : t('companies.modal.roles.admin')}
                    fallback={t('companies.modal.unknownUser')}
                    themeColors={themeColors}
                  />
                ))
              ) : (
                <p className="rounded-2xl px-4 py-3 text-center text-sm font-medium" style={{ color: themeColors.textSecondary }}>
                  {t('companies.modal.noAdmins')}
                </p>
              )}
            </div>
          </section>

          <section className="rounded-[22px] border p-4" style={{ backgroundColor: themeColors.inputBg, borderColor: themeColors.borderColor }}>
            <h3 className="mb-4 text-xs font-extrabold uppercase tracking-widest" style={{ color: theme.primaryColor }}>
              {t('companies.modal.contactInfo')}
            </h3>
            <div className="space-y-4">
              <InfoItem icon={Mail} label={t('companies.modal.email')} value={company.contact_email || t('companies.modal.notDefined')} />
              <InfoItem icon={Phone} label={t('companies.modal.phone')} value={company.contact_phone || t('companies.modal.notDefined')} />
              <InfoItem icon={Globe} label={t('companies.modal.website')} value={company.website_url || t('companies.modal.notDefined')} />
            </div>
          </section>

          <section className="rounded-[22px] border p-4 lg:col-span-2" style={{ backgroundColor: themeColors.inputBg, borderColor: themeColors.borderColor }}>
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="text-xs font-extrabold uppercase tracking-widest" style={{ color: theme.primaryColor }}>
                {t('companies.modal.usersTitle', { count: company.total_users })}
              </h3>
              <span className="text-xs font-bold" style={{ color: themeColors.textSecondary }}>
                {usagePercent}%
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Metric label={t('companies.card.activeUsers')} value={company.active_users} color={theme.successColor} />
              <Metric label={t('companies.modal.invitedUsers')} value={company.invited_users} color={theme.warningColor} />
              <Metric label={t('companies.modal.suspendedUsers')} value={company.suspended_users} color={theme.dangerColor} />
              <Metric label={t('companies.modal.maxUsers')} value={company.max_users || t('companies.card.unlimited')} color={theme.primaryColor} />
            </div>
          </section>

          <button
            type="button"
            onClick={handleNavigateToEdit}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-bold lg:col-span-2"
            style={{
              backgroundColor: theme.primaryColor,
              color: theme.onPrimaryColor,
              boxShadow: `0 12px 28px ${theme.primaryColor}24`,
            }}
          >
            <Pencil className="h-4 w-4" />
            {t('companies.modal.editDetails')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function AdminMemberRow({
  member,
  roleLabel,
  fallback,
  themeColors,
}: {
  member: AdminCompanyMember
  roleLabel: string
  fallback: string
  themeColors: AdminCompaniesThemeColors
}) {
  const theme = useAdminPanelTheme()
  const displayName = getMemberDisplayName(member, fallback)

  return (
    <div className="flex items-center gap-3 rounded-2xl px-3 py-2" style={{ backgroundColor: theme.cardBg }}>
      <div
        className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl font-extrabold"
        style={{ backgroundColor: `${theme.primaryColor}14`, color: theme.primaryColor }}
      >
        {member.user?.profile_picture_url ? (
          <Image
            src={member.user.profile_picture_url}
            alt={displayName}
            fill
            sizes="40px"
            className="object-cover"
            unoptimized
          />
        ) : (
          displayName.charAt(0).toUpperCase()
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold" style={{ color: themeColors.textPrimary }}>
          {displayName}
        </p>
        <p className="truncate text-xs font-medium" style={{ color: themeColors.textSecondary }}>
          {member.user?.email}
        </p>
      </div>
      <span
        className="rounded-xl px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider"
        style={{ backgroundColor: `${theme.primaryColor}14`, color: theme.primaryColor }}
      >
        {roleLabel}
      </span>
    </div>
  )
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  const theme = useAdminPanelTheme()

  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: theme.mutedTextColor }} />
      <div className="min-w-0">
        <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: theme.mutedTextColor }}>
          {label}
        </p>
        <p className="break-all text-sm font-semibold" style={{ color: theme.textColor }}>
          {value}
        </p>
      </div>
    </div>
  )
}

function Metric({ label, value, color }: { label: string; value: number | string; color: string }) {
  const theme = useAdminPanelTheme()

  return (
    <div className="rounded-2xl p-3 text-center" style={{ backgroundColor: theme.cardBg }}>
      <p className="text-xl font-extrabold" style={{ color }}>
        {value}
      </p>
      <p className="text-xs font-bold" style={{ color: theme.subtextColor }}>
        {label}
      </p>
    </div>
  )
}
