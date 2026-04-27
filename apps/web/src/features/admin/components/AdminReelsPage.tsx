'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Calendar, Clock, Edit, Eye, Heart, Pause, Play, Search, Share2, Star, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useAdminTheme } from '../hooks'
import { useAdminReels } from '../hooks/useAdminReels'
import type { AdminReel, CreateReelData, UpdateReelData } from '../services/adminReels.service'
import {
  AdminButton,
  AdminIconButton,
  AdminInput,
  AdminMetricCard,
  AdminPageShell,
  AdminSectionHeader,
  AdminSelect,
  AdminStatusBadge,
  AdminTableContainer,
  AdminToolbar,
} from './ui'

const AddReelModal = dynamic(() => import('./AddReelModal').then((mod) => ({ default: mod.AddReelModal })), {
  ssr: false,
})
const EditReelModal = dynamic(() => import('./EditReelModal').then((mod) => ({ default: mod.EditReelModal })), {
  ssr: false,
})
const DeleteReelModal = dynamic(() => import('./DeleteReelModal').then((mod) => ({ default: mod.DeleteReelModal })), {
  ssr: false,
})
const ViewReelModal = dynamic(() => import('./ViewReelModal').then((mod) => ({ default: mod.ViewReelModal })), {
  ssr: false,
})

const isStatusFilter = (value: string): value is 'all' | 'active' | 'inactive' =>
  value === 'all' || value === 'active' || value === 'inactive'

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString))
}

export function AdminReelsPage() {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()
  const { reels, stats, loading, error, createReel, updateReel, deleteReel, toggleReelStatus, toggleReelFeatured } = useAdminReels()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedReel, setSelectedReel] = useState<AdminReel | null>(null)

  const normalizedSearch = searchTerm.trim().toLowerCase()
  const filteredReels = reels.filter((reel) => {
    const matchesSearch =
      !normalizedSearch ||
      reel.title.toLowerCase().includes(normalizedSearch) ||
      reel.description.toLowerCase().includes(normalizedSearch) ||
      reel.category.toLowerCase().includes(normalizedSearch)
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && reel.is_active) ||
      (statusFilter === 'inactive' && !reel.is_active)
    const matchesCategory = categoryFilter === 'all' || reel.category === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })

  const categories = Array.from(new Set(reels.map((reel) => reel.category))).filter(Boolean)

  const handleAddReel = async (data: CreateReelData) => {
    await createReel(data)
    setShowAddModal(false)
  }

  const handleEditReel = async (data: UpdateReelData) => {
    if (!selectedReel) return

    await updateReel(selectedReel.id, data)
    setShowEditModal(false)
    setSelectedReel(null)
  }

  const handleDeleteReel = async () => {
    if (!selectedReel) return

    await deleteReel(selectedReel.id)
    setShowDeleteModal(false)
    setSelectedReel(null)
  }

  if (loading) {
    return (
      <AdminPageShell maxWidth="wide">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" style={{ color: theme.action }} />
        </div>
      </AdminPageShell>
    )
  }

  if (error) {
    return (
      <AdminPageShell maxWidth="wide">
        <div className="py-12 text-center text-sm font-medium" style={{ color: theme.danger }}>
          {error}
        </div>
      </AdminPageShell>
    )
  }

  return (
    <AdminPageShell maxWidth="wide">
      <AdminSectionHeader
        size="page"
        title={t('reels.page.title')}
        description={t('reels.page.description')}
        actions={<AdminButton onClick={() => setShowAddModal(true)} icon={Play} size="lg">{t('reels.page.add')}</AdminButton>}
      />

      {stats ? (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AdminMetricCard icon={Play} label={t('reels.page.stats.total')} tone="primary" value={stats.totalReels} />
          <AdminMetricCard icon={Eye} label={t('reels.page.stats.active')} tone="primary" value={stats.activeReels} />
          <AdminMetricCard icon={Eye} label={t('reels.page.stats.views')} tone="neutral" value={stats.totalViews.toLocaleString()} />
          <AdminMetricCard icon={Heart} label={t('reels.page.stats.likes')} tone="info" value={stats.totalLikes.toLocaleString()} />
        </div>
      ) : null}

      <AdminToolbar>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" style={{ color: theme.textMuted }} />
          <AdminInput
            className="pl-10"
            placeholder={t('reels.page.searchPlaceholder')}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto">
          <AdminSelect
            className="w-full lg:w-52"
            value={statusFilter}
            onChange={(event) => setStatusFilter(isStatusFilter(event.target.value) ? event.target.value : 'all')}
          >
            <option value="all">{t('reels.page.filters.all')}</option>
            <option value="active">{t('reels.page.filters.active')}</option>
            <option value="inactive">{t('reels.page.filters.inactive')}</option>
          </AdminSelect>
          <AdminSelect className="w-full lg:w-56" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="all">{t('reels.page.allCategories')}</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </AdminSelect>
        </div>
      </AdminToolbar>

      <AdminTableContainer>
        <div className="overflow-auto">
          <table className="min-w-[1100px] w-full text-left">
            <thead>
              <tr style={{ backgroundColor: theme.surfaceSubtle }}>
                {[
                  t('reels.page.table.reel'),
                  t('reels.page.table.category'),
                  t('reels.page.table.duration'),
                  t('reels.page.table.stats'),
                  t('reels.page.table.status'),
                  t('reels.page.table.date'),
                  t('reels.page.table.actions'),
                ].map((heading, index) => (
                  <th
                    key={heading}
                    className={`border-b px-4 py-3 text-xs font-bold uppercase tracking-wider ${index === 6 ? 'text-right' : 'text-left'}`}
                    style={{ borderColor: theme.divider, color: theme.textMuted }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredReels.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm" style={{ color: theme.textMuted }}>
                    {t('reels.page.empty')}
                  </td>
                </tr>
              ) : (
                filteredReels.map((reel) => (
                  <tr key={reel.id} style={{ borderBottom: `1px solid ${theme.divider}` }}>
                    <td className="px-4 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl" style={{ backgroundColor: theme.surfaceSubtle }}>
                          {reel.thumbnail_url ? <img src={reel.thumbnail_url} alt={reel.title} className="h-full w-full object-cover" /> : null}
                          <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: theme.overlay }}>
                            <Play className="h-4 w-4" style={{ color: theme.inverseText }} />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold" style={{ color: theme.text }}>
                            {reel.title}
                          </p>
                          <p className="line-clamp-1 text-xs" style={{ color: theme.textMuted }}>
                            {reel.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <AdminStatusBadge tone="primary">{reel.category}</AdminStatusBadge>
                    </td>
                    <td className="px-4 py-4 text-sm" style={{ color: theme.textMuted }}>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDuration(reel.duration_seconds)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm" style={{ color: theme.textMuted }}>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1"><Eye className="h-4 w-4" />{reel.view_count.toLocaleString()}</span>
                        <span className="inline-flex items-center gap-1"><Heart className="h-4 w-4" />{reel.like_count.toLocaleString()}</span>
                        <span className="inline-flex items-center gap-1"><Share2 className="h-4 w-4" />{reel.share_count.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col items-start gap-1">
                        <AdminStatusBadge tone={reel.is_active ? 'primary' : 'neutral'}>
                          {reel.is_active ? t('reels.page.statusActive') : t('reels.page.statusInactive')}
                        </AdminStatusBadge>
                        {reel.is_featured ? (
                          <AdminStatusBadge tone="warning">
                            <Star className="h-3.5 w-3.5" />
                            {t('reels.page.statusFeatured')}
                          </AdminStatusBadge>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm" style={{ color: theme.textMuted }}>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(reel.created_at)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <AdminIconButton
                          icon={Eye}
                          label={t('reels.page.tooltipView')}
                          onClick={() => {
                            setSelectedReel(reel)
                            setShowViewModal(true)
                          }}
                          tone="neutral"
                        />
                        <AdminIconButton
                          icon={Edit}
                          label={t('reels.page.tooltipEdit')}
                          onClick={() => {
                            setSelectedReel(reel)
                            setShowEditModal(true)
                          }}
                        />
                        <AdminIconButton
                          icon={reel.is_active ? Pause : Play}
                          label={reel.is_active ? t('reels.page.tooltipDeactivate') : t('reels.page.tooltipActivate')}
                          onClick={() => toggleReelStatus(reel.id)}
                          tone={reel.is_active ? 'danger' : 'primary'}
                        />
                        <AdminIconButton
                          icon={Star}
                          label={reel.is_featured ? t('reels.page.tooltipUnfeature') : t('reels.page.tooltipFeature')}
                          onClick={() => toggleReelFeatured(reel.id)}
                          tone="warning"
                        />
                        <AdminIconButton
                          icon={Trash2}
                          label={t('reels.page.tooltipDelete')}
                          onClick={() => {
                            setSelectedReel(reel)
                            setShowDeleteModal(true)
                          }}
                          tone="danger"
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AdminTableContainer>

      {showAddModal ? <AddReelModal onClose={() => setShowAddModal(false)} onSave={handleAddReel} /> : null}
      {showEditModal && selectedReel ? (
        <EditReelModal
          reel={selectedReel}
          onClose={() => {
            setShowEditModal(false)
            setSelectedReel(null)
          }}
          onSave={handleEditReel}
        />
      ) : null}
      {showDeleteModal && selectedReel ? (
        <DeleteReelModal
          reel={selectedReel}
          onClose={() => {
            setShowDeleteModal(false)
            setSelectedReel(null)
          }}
          onConfirm={handleDeleteReel}
        />
      ) : null}
      {showViewModal && selectedReel ? (
        <ViewReelModal
          reel={selectedReel}
          onClose={() => {
            setShowViewModal(false)
            setSelectedReel(null)
          }}
        />
      ) : null}
    </AdminPageShell>
  )
}
