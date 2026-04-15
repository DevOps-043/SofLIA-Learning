'use client'

import { useState } from 'react'
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
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.08, duration: 0.5, type: 'spring', stiffness: 80 }}
      whileHover={{ y: -10, scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative rounded-3xl overflow-hidden"
      style={{
        background: `linear-gradient(145deg, ${adminCommunitiesColors.bgSecondary} 0%, ${adminCommunitiesColors.bgTertiary} 100%)`,
        border: `1px solid ${isHovered ? `${adminCommunitiesColors.accent}50` : 'rgba(255,255,255,0.05)'}`
      }}
    >
      <motion.div
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${adminCommunitiesColors.accent}15 0%, transparent 60%)`,
          pointerEvents: 'none'
        }}
      />

      <div className="relative h-44 overflow-hidden">
        {community.image_url ? (
          <>
            <motion.img
              src={community.image_url}
              alt={community.name}
              className="w-full h-full object-cover"
              animate={{ scale: isHovered ? 1.1 : 1 }}
              transition={{ duration: 0.5 }}
              onError={(event) => {
                event.currentTarget.style.display = 'none'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${adminCommunitiesColors.primary} 0%, ${adminCommunitiesColors.accent}30 100%)` }}>
            <motion.div animate={{ rotate: isHovered ? 360 : 0 }} transition={{ duration: 2, ease: 'linear' }}>
              <Users className="w-16 h-16 text-white/30" />
            </motion.div>
          </div>
        )}

        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.08 + 0.2 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md"
            style={{ background: typeInfo.background, border: `1px solid ${typeInfo.color}40` }}
          >
            <TypeIcon className="w-3.5 h-3.5" style={{ color: typeInfo.color }} />
            <span className="text-xs font-semibold" style={{ color: typeInfo.color }}>{typeInfo.label}</span>
          </motion.div>

          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.08 + 0.3 }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md ${community.is_active ? 'bg-emerald-500/20 border border-emerald-500/40' : 'bg-gray-500/20 border border-gray-500/40'}`}
          >
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} className={`w-2 h-2 rounded-full ${community.is_active ? 'bg-emerald-400' : 'bg-gray-400'}`} />
            <span className={`text-xs font-semibold ${community.is_active ? 'text-emerald-400' : 'text-gray-400'}`}>
              {community.is_active ? ta('communityCard.statusActive') : ta('communityCard.statusInactive')}
            </span>
          </motion.div>
        </div>

        <AnimatePresence>
          {isHovered && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-2">
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={(event) => { event.stopPropagation(); onView() }} className="p-2.5 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors" title={t('actions.viewDetails')}>
                <Eye className="w-4 h-4" />
              </motion.button>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={(event) => { event.stopPropagation(); onToggleVisibility() }} className="p-2.5 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors" title={community.is_active ? ta('communityCard.deactivate') : ta('communityCard.activate')}>
                {community.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </motion.button>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={(event) => { event.stopPropagation(); onEdit() }} className="p-2.5 rounded-xl backdrop-blur-md border border-white/20 text-white transition-colors" style={{ background: `${adminCommunitiesColors.accent}30` }} title={t('actions.edit')}>
                <Edit3 className="w-4 h-4" />
              </motion.button>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={(event) => { event.stopPropagation(); onDelete() }} className="p-2.5 rounded-xl backdrop-blur-md bg-red-500/30 border border-red-500/40 text-red-400 hover:bg-red-500/40 transition-colors" title={t('actions.delete')}>
                <Trash2 className="w-4 h-4" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-5">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-[#00D4B3] transition-colors">{community.name}</h3>

          {community.course && (
            <motion.div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs" style={{ background: `${adminCommunitiesColors.primary}80`, border: `1px solid ${adminCommunitiesColors.accent}30` }}>
              <BookOpen className="w-3 h-3" style={{ color: adminCommunitiesColors.accent }} />
              <span className="text-white/80 font-medium truncate max-w-[180px]">{community.course.title}</span>
            </motion.div>
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
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold" style={{ background: `linear-gradient(135deg, ${adminCommunitiesColors.accent} 0%, ${adminCommunitiesColors.primary} 100%)`, color: 'white' }}>
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
