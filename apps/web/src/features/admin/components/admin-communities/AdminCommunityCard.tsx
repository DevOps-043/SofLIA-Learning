'use client'

import { useState, type MouseEvent } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
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

import type { AdminCommunity } from '../../services/adminCommunities.service'
import { useAdminTheme } from '../../hooks/useAdminTheme'
import { AdminIconButton, AdminStatusBadge } from '../ui'

interface AdminCommunityCardProps {
  community: AdminCommunity
  index: number
  onView: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleVisibility: () => void
}

export function AdminCommunityCard({
  community,
  index,
  onView,
  onEdit,
  onDelete,
  onToggleVisibility,
}: AdminCommunityCardProps) {
  const { t } = useTranslation('common')
  const { t: ta } = useTranslation('admin')
  const theme = useAdminTheme()
  const [isHovered, setIsHovered] = useState(false)

  function resolveTypeInfo(c: AdminCommunity) {
    if (c.visibility === 'private') {
      return { label: ta('communityCard.typePrivate'), icon: Lock, tone: 'warning' as const }
    }

    if (c.access_type === 'moderated') {
      return { label: ta('communityCard.typeModerated'), icon: UserCheck, tone: 'info' as const }
    }

    return { label: ta('communityCard.typePublic'), icon: Globe, tone: 'primary' as const }
  }

  const typeInfo = resolveTypeInfo(community)
  const TypeIcon = typeInfo.icon
  const statusLabel = community.is_active ? ta('communityCard.statusActive') : ta('communityCard.statusInactive')

  const stopAndRun = (handler: () => void) => (event?: MouseEvent<HTMLButtonElement>) => {
    event?.stopPropagation()
    handler()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: Math.min(index * 0.04, 0.28), duration: 0.28, ease: 'easeOut' }}
      whileHover={{ y: -4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onView}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border shadow-sm transition-all duration-200"
      style={{
        backgroundColor: theme.surface,
        borderColor: isHovered ? theme.actionSurface : theme.border,
        boxShadow: isHovered ? theme.shadow : undefined,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ backgroundColor: theme.hover }}
      />

      <div className="relative h-44 overflow-hidden">
        {community.image_url ? (
          <>
            <Image
              src={community.image_url}
              alt={community.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(event) => {
                ;(event.currentTarget as HTMLImageElement).style.display = 'none'
              }}
            />
            <div className="absolute inset-0 bg-black/45" />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: theme.actionSurface }}>
            <Users className="h-14 w-14 transition-transform duration-300 group-hover:scale-105" style={{ color: theme.action }} />
          </div>
        )}

        <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-2">
          <AdminStatusBadge tone={typeInfo.tone} className="backdrop-blur-md">
            <TypeIcon className="h-3.5 w-3.5" />
            {typeInfo.label}
          </AdminStatusBadge>
          <AdminStatusBadge tone={community.is_active ? 'primary' : 'neutral'} className="backdrop-blur-md">
            {statusLabel}
          </AdminStatusBadge>
        </div>

        <AnimatePresence>
          {isHovered ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.16 }}
              className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-2"
            >
              <AdminIconButton icon={Eye} label={t('actions.viewDetails')} onClick={stopAndRun(onView)} tone="primary" />
              <AdminIconButton
                icon={community.is_active ? EyeOff : Eye}
                label={community.is_active ? ta('communityCard.deactivate') : ta('communityCard.activate')}
                onClick={stopAndRun(onToggleVisibility)}
                tone="primary"
              />
              <AdminIconButton icon={Edit3} label={t('actions.edit')} onClick={stopAndRun(onEdit)} tone="primary" />
              <AdminIconButton icon={Trash2} label={t('actions.delete')} onClick={stopAndRun(onDelete)} tone="danger" />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="relative p-5">
        <div className="mb-4">
          <h3 className="mb-2 line-clamp-1 text-lg font-bold" style={{ color: theme.text }}>
            {community.name}
          </h3>

          {community.course ? (
            <div
              className="inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs"
              style={{ backgroundColor: theme.actionSurface, borderColor: theme.border }}
            >
              <BookOpen className="h-3 w-3 shrink-0" style={{ color: theme.action }} />
              <span className="truncate font-medium" style={{ color: theme.text }}>
                {community.course.title}
              </span>
            </div>
          ) : null}
        </div>

        <p className="mb-5 min-h-[40px] line-clamp-2 text-sm" style={{ color: theme.textMuted }}>
          {community.description}
        </p>

        <div className="mb-5 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-xl p-3" style={{ backgroundColor: theme.surfaceSubtle }}>
            <div className="rounded-lg p-2" style={{ backgroundColor: theme.actionSurface }}>
              <Users className="h-4 w-4" style={{ color: theme.action }} />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold leading-none" style={{ color: theme.text }}>{community.member_count}</p>
              <p className="mt-1 truncate text-xs" style={{ color: theme.textMuted }}>{ta('communityCard.membersLabel')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl p-3" style={{ backgroundColor: theme.surfaceSubtle }}>
            <div className="rounded-lg p-2" style={{ backgroundColor: theme.actionSurface }}>
              <MessageCircle className="h-4 w-4" style={{ color: theme.action }} />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold leading-none" style={{ color: theme.text }}>{community.posts_count || 0}</p>
              <p className="mt-1 truncate text-xs" style={{ color: theme.textMuted }}>{ta('communityCard.postsLabel')}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: theme.divider }}>
          <div className="flex min-w-0 items-center gap-2">
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
              style={{ backgroundColor: theme.action, color: theme.onAction }}
            >
              {(community.creator_name || 'A')[0].toUpperCase()}
            </div>
            <span className="truncate text-sm" style={{ color: theme.textMuted }}>
              {community.creator_name || ta('communityCard.noCreator')}
            </span>
          </div>

          <div className="ml-3 flex shrink-0 items-center gap-1.5 text-xs" style={{ color: theme.textMuted }}>
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {community.created_at
                ? new Date(community.created_at).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })
                : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
