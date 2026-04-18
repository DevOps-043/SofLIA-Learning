'use client'

import { useState } from 'react'
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
import { adminCommunitiesColors } from './shared'

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
  const [isHovered, setIsHovered] = useState(false)

  function resolveTypeInfo(c: AdminCommunity) {
    if (c.visibility === 'private') {
      return { label: ta('communityCard.typePrivate'), icon: Lock, color: adminCommunitiesColors.warning, background: `${adminCommunitiesColors.warning}20` }
    }
    if (c.access_type === 'moderated') {
      return { label: ta('communityCard.typeModerated'), icon: UserCheck, color: adminCommunitiesColors.purple, background: `${adminCommunitiesColors.purple}33` }
    }
    return { label: ta('communityCard.typePublic'), icon: Globe, color: adminCommunitiesColors.success, background: `${adminCommunitiesColors.success}20` }
  }

  const typeInfo = resolveTypeInfo(community)
  const TypeIcon = typeInfo.icon

  return (
    // Single motion.div per card — entrance animation + hover lift
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: Math.min(index * 0.05, 0.4), duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -8, scale: 1.01 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative rounded-3xl overflow-hidden"
      style={{
        background: `linear-gradient(145deg, ${adminCommunitiesColors.bgSecondary} 0%, ${adminCommunitiesColors.bgTertiary} 100%)`,
        border: `1px solid ${isHovered ? `${adminCommunitiesColors.accent}50` : 'rgba(255,255,255,0.05)'}`,
        willChange: 'transform',
      }}
    >
      {/* Hover glow overlay — CSS only, no JS animation */}
      <div
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 0%, ${adminCommunitiesColors.accent}15 0%, transparent 60%)` }}
      />

      {/* Image section */}
      <div className="relative h-44 overflow-hidden">
        {community.image_url ? (
          <>
            {/* next/image instead of motion.img — CSS transition for hover scale */}
            <div className="w-full h-full overflow-hidden">
              <Image
                src={community.image_url}
                alt={community.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                onError={(event) => {
                  (event.currentTarget as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          </>
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${adminCommunitiesColors.primary} 0%, ${adminCommunitiesColors.accent}30 100%)` }}
          >
            <Users className="w-16 h-16 text-white/30 transition-transform duration-300 group-hover:scale-110" />
          </div>
        )}

        {/* Badges — plain divs, no per-badge framer-motion */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-sm"
            style={{ background: typeInfo.background, border: `1px solid ${typeInfo.color}40` }}
          >
            <TypeIcon className="w-3.5 h-3.5" style={{ color: typeInfo.color }} />
            <span className="text-xs font-semibold" style={{ color: typeInfo.color }}>{typeInfo.label}</span>
          </div>

          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm ${community.is_active ? 'bg-emerald-500/20 border border-emerald-500/40' : 'bg-gray-500/20 border border-gray-500/40'}`}>
            {/* CSS animate-pulse instead of JS repeat:Infinity scale */}
            <div className={`w-2 h-2 rounded-full animate-pulse ${community.is_active ? 'bg-emerald-400' : 'bg-gray-400'}`} />
            <span className={`text-xs font-semibold ${community.is_active ? 'text-emerald-400' : 'text-gray-400'}`}>
              {community.is_active ? ta('communityCard.statusActive') : ta('communityCard.statusInactive')}
            </span>
          </div>
        </div>

        {/* Action buttons overlay — single AnimatePresence wrapping one motion.div */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-2"
            >
              <button
                onClick={(e) => { e.stopPropagation(); onView() }}
                className="p-2.5 rounded-xl backdrop-blur-sm bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
                title={t('actions.viewDetails')}
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onToggleVisibility() }}
                className="p-2.5 rounded-xl backdrop-blur-sm bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
                title={community.is_active ? ta('communityCard.deactivate') : ta('communityCard.activate')}
              >
                {community.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onEdit() }}
                className="p-2.5 rounded-xl backdrop-blur-sm border border-white/20 text-white transition-colors hover:opacity-80"
                style={{ background: `${adminCommunitiesColors.accent}30` }}
                title={t('actions.edit')}
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete() }}
                className="p-2.5 rounded-xl backdrop-blur-sm bg-red-500/30 border border-red-500/40 text-red-400 hover:bg-red-500/40 transition-colors"
                title={t('actions.delete')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-5">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-[#00D4B3] transition-colors">
            {community.name}
          </h3>

          {community.course && (
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
              style={{ background: `${adminCommunitiesColors.primary}80`, border: `1px solid ${adminCommunitiesColors.accent}30` }}
            >
              <BookOpen className="w-3 h-3" style={{ color: adminCommunitiesColors.accent }} />
              <span className="text-white/80 font-medium truncate max-w-[180px]">{community.course.title}</span>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-400 line-clamp-2 mb-5 min-h-[40px]">{community.description}</p>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: `${adminCommunitiesColors.bgTertiary}80` }}>
            <div className="p-2 rounded-lg" style={{ background: `${adminCommunitiesColors.accent}20` }}>
              <Users className="w-4 h-4" style={{ color: adminCommunitiesColors.accent }} />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{community.member_count}</p>
              <p className="text-xs text-gray-500">{ta('communityCard.membersLabel')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: `${adminCommunitiesColors.bgTertiary}80` }}>
            <div className="p-2 rounded-lg" style={{ background: `${adminCommunitiesColors.success}20` }}>
              <MessageCircle className="w-4 h-4" style={{ color: adminCommunitiesColors.success }} />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{community.posts_count || 0}</p>
              <p className="text-xs text-gray-500">{ta('communityCard.postsLabel')}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
              style={{ background: `linear-gradient(135deg, ${adminCommunitiesColors.accent} 0%, ${adminCommunitiesColors.primary} 100%)`, color: 'white' }}
            >
              {(community.creator_name || 'A')[0].toUpperCase()}
            </div>
            <span className="text-sm text-gray-400 truncate max-w-[120px]">{community.creator_name || ta('communityCard.noCreator')}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar className="w-3.5 h-3.5" />
            <span>{community.created_at ? new Date(community.created_at).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }) : 'N/A'}</span>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 cursor-pointer z-0" onClick={onView} />
    </motion.div>
  )
}
