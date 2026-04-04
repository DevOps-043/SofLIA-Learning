'use client'

import React from 'react'
import { FixedSizeList } from 'react-window'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  Lock, 
  Globe,
  Crown,
  Clock,
  MessageSquare
} from 'lucide-react'
import { Button } from '@aprende-y-aplica/ui'

interface Community {
  id: string
  name: string
  description: string
  slug: string
  image_url?: string
  member_count: number
  is_active: boolean
  visibility: string
  access_type: 'free' | 'invitation_only' | 'paid'
  category?: string
  is_member?: boolean
}

interface VirtualCommunitiesGridProps {
  communities: Community[]
  containerWidth: number
  containerHeight: number
  onJoinCommunity: (community: Community) => void
}

export function VirtualCommunitiesGrid({ 
  communities, 
  containerWidth, 
  containerHeight,
  onJoinCommunity 
}: VirtualCommunitiesGridProps) {
  const router = useRouter()
  
  // Calculate columns based on container width
  const columnWidth = 380
  const columnCount = Math.floor(containerWidth / columnWidth) || 1
  const rowHeight = 280
  const rowCount = Math.ceil(communities.length / columnCount)

  const CommunityCard = ({ columnIndex, rowIndex, style }: { columnIndex: number; rowIndex: number; style: React.CSSProperties }) => {
    const index = rowIndex * columnCount + columnIndex
    if (index >= communities.length) return null
    
    const community = communities[index]

    const getCategoryIcon = (category?: string) => {
      switch (category) {
        case 'technology': return '💻'
        case 'business': return '💼'
        case 'design': return '🎨'
        case 'marketing': return '📢'
        default: return '👥'
      }
    }

    const getAccessIcon = () => {
      switch (community.access_type) {
        case 'invitation_only':
          return <Lock className="w-4 h-4 text-yellow-400" />
        case 'paid':
          return <Crown className="w-4 h-4 text-purple-400" />
        default:
          return <Globe className="w-4 h-4 text-green-400" />
      }
    }

    return (
      <div style={{ ...style, padding: '12px' }}>
        <div
          className="group bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 
                     hover:border-blue-500/50 hover:bg-slate-800/80 transition-all duration-300 
                     hover:shadow-lg hover:shadow-blue-500/10 h-full flex flex-col cursor-pointer"
          onClick={() => router.push(`/communities/${community.slug}`)}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {community.image_url ? (
                <img
                  src={community.image_url}
                  alt={community.name}
                  className="w-12 h-12 rounded-lg object-cover ring-2 ring-slate-700 
                           group-hover:ring-blue-500/50 transition-all"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 
                              flex items-center justify-center text-2xl ring-2 ring-slate-700 
                              group-hover:ring-blue-500/50 transition-all">
                  {getCategoryIcon(community.category)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors 
                             truncate text-lg">
                  {community.name}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Users className="w-3 h-3" />
                  <span>{community.member_count} miembros</span>
                </div>
              </div>
            </div>
            {getAccessIcon()}
          </div>

          {/* Description */}
          <p className="text-sm text-slate-300 mb-4 line-clamp-2 flex-1">
            {community.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                <span>Activo</span>
              </div>
              {community.category && (
                <span className="px-2 py-1 bg-slate-700/50 rounded text-slate-300 capitalize">
                  {community.category}
                </span>
              )}
            </div>

            {community.is_member ? (
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/communities/${community.slug}`)
                }}
              >
                Ver comunidad
              </Button>
            ) : (
              <Button
                size="sm"
                className="text-xs bg-blue-500 hover:bg-blue-600"
                onClick={(e) => {
                  e.stopPropagation()
                  onJoinCommunity(community)
                }}
              >
                Unirse
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <FixedSizeGrid
      columnCount={columnCount}
      columnWidth={columnWidth}
      height={containerHeight}
      rowCount={rowCount}
      rowHeight={rowHeight}
      width={containerWidth}
      className="scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800"
    >
      {CommunityCard}
    </FixedSizeGrid>
  )
}
