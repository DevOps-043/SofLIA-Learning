'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Calendar,
  Edit3,
  Eye,
  EyeOff,
  Globe,
  Lock,
  MessageCircle,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import type { AdminCommunity } from '../../services/adminCommunities.service'
import {
  getAdminCommunityCreatorInitial,
  getAdminCommunityStatusConfig,
  getAdminCommunityTypeConfig,
} from './admin-communities-display.service'
import type { AdminCommunitiesViewMode } from './shared'

interface AdminCommunityCardProps {
  community: AdminCommunity
  index: number
  viewMode: AdminCommunitiesViewMode
  onView: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleVisibility: () => void
}

export function AdminCommunityCard({
  community,
  index,
  viewMode,
  onView,
  onEdit,
  onDelete,
  onToggleVisibility,
}: AdminCommunityCardProps) {
  const { t } = useTranslation('common')
  const { t: ta } = useTranslation('admin')
  const theme = useAdminPanelTheme()
  const typeInfo = getAdminCommunityTypeConfig(community, theme)
  const statusInfo = getAdminCommunityStatusConfig(community.is_active, theme)
  const TypeIcon =
    community.visibility === 'private'
      ? Lock
      : community.access_type === 'moderated'
        ? UserCheck
        : Globe
  const creatorInitial = getAdminCommunityCreatorInitial(community.creator_name)
  const isList = viewMode === 'list'

  const actionButtons = (
    <div className="flex items-center gap-2">
      <button
        onClick={(event) => {
          event.stopPropagation()
          onView()
        }}
        className="rounded-xl border p-2.5 transition-colors"
        style={{
          backgroundColor: theme.inputBg,
          borderColor: theme.borderColor,
          color: theme.subtextColor,
        }}
        title={t('actions.viewDetails')}
        type="button"
      >
        <Eye className="h-4 w-4" />
      </button>
      <button
        onClick={(event) => {
          event.stopPropagation()
          onToggleVisibility()
        }}
        className="rounded-xl border p-2.5 transition-colors"
        style={{
          backgroundColor: theme.inputBg,
          borderColor: theme.borderColor,
          color: community.is_active ? theme.warningColor : theme.successColor,
        }}
        title={
          community.is_active
            ? ta('communityCard.deactivate')
            : ta('communityCard.activate')
        }
        type="button"
      >
        {community.is_active ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
      <button
        onClick={(event) => {
          event.stopPropagation()
          onEdit()
        }}
        className="rounded-xl border p-2.5 transition-colors"
        style={{
          backgroundColor: theme.actionSurface,
          borderColor: theme.heroBorderColor,
          color: theme.primaryColor,
        }}
        title={t('actions.edit')}
        type="button"
      >
        <Edit3 className="h-4 w-4" />
      </button>
      <button
        onClick={(event) => {
          event.stopPropagation()
          onDelete()
        }}
        className="rounded-xl border p-2.5 transition-colors"
        style={{
          backgroundColor: `${theme.dangerColor}14`,
          borderColor: `${theme.dangerColor}26`,
          color: theme.dangerColor,
        }}
        title={t('actions.delete')}
        type="button"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{
        delay: Math.min(index * 0.04, 0.28),
        duration: 0.35,
        ease: 'easeOut',
      }}
      whileHover={{ y: -4 }}
      onClick={onView}
      className={
        isList
          ? 'group grid cursor-pointer gap-5 overflow-hidden rounded-2xl border p-4 shadow-sm md:grid-cols-[220px_1fr]'
          : 'group cursor-pointer overflow-hidden rounded-2xl border shadow-sm'
      }
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.borderColor,
      }}
    >
      <div
        className={
          isList
            ? 'relative h-44 overflow-hidden rounded-xl md:h-full'
            : 'relative h-44 overflow-hidden'
        }
        style={{ backgroundColor: theme.inputBg }}
      >
        {community.image_url ? (
          <>
            <Image
              src={community.image_url}
              alt={community.name}
              fill
              sizes={
                isList
                  ? '(max-width: 768px) 100vw, 220px'
                  : '(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw'
              }
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to top, rgba(0,0,0,0.62), rgba(0,0,0,0.16), transparent)',
              }}
            />
          </>
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ background: theme.heroBackground }}
          >
            <Users
              className="h-16 w-16 opacity-50"
              style={{ color: theme.inverseTextColor }}
            />
          </div>
        )}

        <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-2">
          <div
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 backdrop-blur-sm"
            style={{
              backgroundColor: typeInfo.bg,
              borderColor: typeInfo.border,
              color: typeInfo.color,
            }}
          >
            <TypeIcon className="h-3.5 w-3.5" />
            <span className="text-xs font-semibold">{ta(typeInfo.labelKey)}</span>
          </div>

          <div
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 backdrop-blur-sm"
            style={{
              backgroundColor: statusInfo.bg,
              borderColor: statusInfo.border,
              color: statusInfo.color,
            }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: statusInfo.color }}
            />
            <span className="text-xs font-semibold">
              {ta(statusInfo.labelKey)}
            </span>
          </div>
        </div>
      </div>

      <div className={isList ? 'flex min-w-0 flex-col' : 'p-5'}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3
              className="mb-2 line-clamp-1 text-lg font-bold transition-colors"
              style={{ color: theme.textColor }}
            >
              {community.name}
            </h3>

            {community.course && (
              <div
                className="inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs"
                style={{
                  backgroundColor: theme.actionSurface,
                  borderColor: theme.heroBorderColor,
                }}
              >
                <BookOpen className="h-3 w-3" style={{ color: theme.primaryColor }} />
                <span
                  className="truncate font-medium"
                  style={{ color: theme.textColor }}
                >
                  {community.course.title}
                </span>
              </div>
            )}
          </div>

          {isList ? actionButtons : null}
        </div>

        <p
          className={isList ? 'mb-5 line-clamp-2 text-sm' : 'mb-5 line-clamp-2 min-h-[40px] text-sm'}
          style={{ color: theme.subtextColor }}
        >
          {community.description}
        </p>

        <div className="mb-5 grid grid-cols-2 gap-3">
          <div
            className="flex items-center gap-3 rounded-xl p-3"
            style={{ backgroundColor: theme.inputBg }}
          >
            <div
              className="rounded-lg p-2"
              style={{ backgroundColor: theme.actionSurface }}
            >
              <Users className="h-4 w-4" style={{ color: theme.primaryColor }} />
            </div>
            <div>
              <p className="text-lg font-bold" style={{ color: theme.textColor }}>
                {community.member_count}
              </p>
              <p className="text-xs" style={{ color: theme.mutedTextColor }}>
                {ta('communityCard.membersLabel')}
              </p>
            </div>
          </div>

          <div
            className="flex items-center gap-3 rounded-xl p-3"
            style={{ backgroundColor: theme.inputBg }}
          >
            <div
              className="rounded-lg p-2"
              style={{ backgroundColor: `${theme.successColor}14` }}
            >
              <MessageCircle
                className="h-4 w-4"
                style={{ color: theme.successColor }}
              />
            </div>
            <div>
              <p className="text-lg font-bold" style={{ color: theme.textColor }}>
                {community.posts_count || 0}
              </p>
              <p className="text-xs" style={{ color: theme.mutedTextColor }}>
                {ta('communityCard.postsLabel')}
              </p>
            </div>
          </div>
        </div>

        <div
          className="mt-auto flex items-center justify-between gap-3 border-t pt-4"
          style={{ borderColor: theme.dividerColor }}
        >
          <div className="flex min-w-0 items-center gap-2">
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{
                background: `linear-gradient(135deg, ${theme.accentColor}, ${theme.primaryColor})`,
                color: theme.onPrimaryColor,
              }}
            >
              {creatorInitial}
            </div>
            <span
              className="truncate text-sm"
              style={{ color: theme.subtextColor }}
            >
              {community.creator_name || ta('communityCard.noCreator')}
            </span>
          </div>

          <div
            className="flex flex-shrink-0 items-center gap-1.5 text-xs"
            style={{ color: theme.mutedTextColor }}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {community.created_at
                ? new Date(community.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })
                : ta('communityCard.noDate')}
            </span>
          </div>
        </div>

        {!isList ? <div className="mt-4">{actionButtons}</div> : null}
      </div>
    </motion.article>
  )
}
