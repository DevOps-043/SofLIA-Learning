'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { ClockIcon, DocumentTextIcon, EyeIcon, PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

import { useAdminTheme } from '../hooks'
import { useAdminNews } from '../hooks/useAdminNews'
import type { AdminNews } from '../services/adminNews.service'
import {
  AdminButton,
  AdminIconButton,
  AdminInput,
  AdminMetricCard,
  AdminPageShell,
  AdminSectionHeader,
  AdminSelect,
  AdminStatusBadge,
  AdminSurface,
  AdminToolbar,
} from './ui'

const AddNewsModal = dynamic(() => import('./AddNewsModal').then((mod) => ({ default: mod.AddNewsModal })), {
  ssr: false,
})
const EditNewsModal = dynamic(() => import('./EditNewsModal').then((mod) => ({ default: mod.EditNewsModal })), {
  ssr: false,
})
const DeleteNewsModal = dynamic(() => import('./DeleteNewsModal').then((mod) => ({ default: mod.DeleteNewsModal })), {
  ssr: false,
})
const ViewNewsModal = dynamic(() => import('./ViewNewsModal').then((mod) => ({ default: mod.ViewNewsModal })), {
  ssr: false,
})

type NewsStatusFilter = 'all' | 'draft' | 'published' | 'archived'

function isNewsStatusFilter(value: string): value is NewsStatusFilter {
  return value === 'all' || value === 'draft' || value === 'published' || value === 'archived'
}

function getStatusTone(status: string) {
  if (status === 'published') return 'primary' as const
  if (status === 'draft') return 'warning' as const
  if (status === 'archived') return 'neutral' as const
  return 'neutral' as const
}

function getMetric(metrics: unknown, key: 'views' | 'comments') {
  if (!metrics || typeof metrics !== 'object') return 0
  const value = (metrics as Record<string, unknown>)[key]
  return typeof value === 'number' ? value : 0
}

export function AdminNewsPage() {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()
  const { news, stats, isLoading, error, createNews, updateNews, deleteNews } = useAdminNews()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<NewsStatusFilter>('all')
  const [selectedNews, setSelectedNews] = useState<AdminNews | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)

  const normalizedSearch = searchTerm.trim().toLowerCase()
  const filteredNews = news.filter((newsItem) => {
    const matchesSearch =
      !normalizedSearch ||
      newsItem.title.toLowerCase().includes(normalizedSearch) ||
      newsItem.intro?.toLowerCase().includes(normalizedSearch) ||
      newsItem.subtitle?.toLowerCase().includes(normalizedSearch)
    const matchesStatus = statusFilter === 'all' || newsItem.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleSaveNewNews = async (newsData: Partial<AdminNews>) => {
    await createNews(newsData)
    setShowAddModal(false)
  }

  const handleSaveEditNews = async (newsData: Partial<AdminNews>) => {
    if (!selectedNews) return

    await updateNews(selectedNews.id, newsData)
    setShowEditModal(false)
    setSelectedNews(null)
  }

  const handleDeleteNews = async () => {
    if (!selectedNews) return

    await deleteNews(selectedNews.id)
    setShowDeleteModal(false)
    setSelectedNews(null)
  }

  if (isLoading) {
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
        <AdminSurface className="p-6 text-center">
          <p className="text-sm font-medium" style={{ color: theme.danger }}>
            {error}
          </p>
        </AdminSurface>
      </AdminPageShell>
    )
  }

  return (
    <AdminPageShell maxWidth="wide">
      <AdminSectionHeader
        size="page"
        title={t('news.page.title')}
        description={t('news.page.description')}
        actions={<AdminButton onClick={() => setShowAddModal(true)} icon={PlusIcon} size="lg">{t('news.page.add')}</AdminButton>}
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard icon={DocumentTextIcon} label={t('news.page.stats.total')} tone="primary" value={stats.totalNews} />
        <AdminMetricCard icon={DocumentTextIcon} label={t('news.page.stats.published')} tone="primary" value={stats.publishedNews} />
        <AdminMetricCard icon={ClockIcon} label={t('news.page.stats.drafts')} tone="warning" value={stats.draftNews} />
        <AdminMetricCard icon={EyeIcon} label={t('news.page.stats.views')} tone="neutral" value={stats.totalViews.toLocaleString()} />
      </div>

      <AdminToolbar>
        <div className="relative flex-1">
          <DocumentTextIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" style={{ color: theme.textMuted }} />
          <AdminInput
            className="pl-10"
            placeholder={t('news.page.searchPlaceholder')}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <AdminSelect
          className="w-full lg:w-56"
          value={statusFilter}
          onChange={(event) => {
            const nextStatus = event.target.value
            if (isNewsStatusFilter(nextStatus)) {
              setStatusFilter(nextStatus)
            }
          }}
        >
          <option value="all">{t('news.page.filters.all')}</option>
          <option value="published">{t('news.page.filters.published')}</option>
          <option value="draft">{t('news.page.filters.draft')}</option>
          <option value="archived">{t('news.page.filters.archived')}</option>
        </AdminSelect>
      </AdminToolbar>

      <AdminSurface className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: theme.text }}>
            {t('news.page.listTitle', { count: filteredNews.length })}
          </h2>
        </div>

        {filteredNews.length === 0 ? (
          <div className="py-10 text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12" style={{ color: theme.textMuted }} />
            <p className="mt-4 text-sm" style={{ color: theme.textMuted }}>
              {t('news.page.empty')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNews.map((newsItem) => (
              <div
                key={newsItem.id}
                className="rounded-2xl border p-4"
                style={{ borderColor: theme.border, backgroundColor: theme.surfaceSubtle }}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3 className="min-w-0 truncate text-lg font-bold" style={{ color: theme.text }}>
                        {newsItem.title}
                      </h3>
                      <AdminStatusBadge tone={getStatusTone(newsItem.status)}>
                        {t(`news.page.status.${newsItem.status}`, { defaultValue: newsItem.status })}
                      </AdminStatusBadge>
                    </div>
                    {newsItem.intro ? (
                      <p className="line-clamp-2 text-sm leading-6" style={{ color: theme.textMuted }}>
                        {newsItem.intro}
                      </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm" style={{ color: theme.textMuted }}>
                      <span>{newsItem.language}</span>
                      <span>{t('news.page.views', { count: getMetric(newsItem.metrics, 'views') })}</span>
                      <span>{t('news.page.comments', { count: getMetric(newsItem.metrics, 'comments') })}</span>
                      <span>{new Date(newsItem.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 lg:justify-end">
                    <AdminIconButton
                      icon={EyeIcon}
                      label={t('news.page.tooltipView')}
                      onClick={() => {
                        setSelectedNews(newsItem)
                        setShowViewModal(true)
                      }}
                      tone="neutral"
                    />
                    <AdminIconButton
                      icon={PencilIcon}
                      label={t('news.page.tooltipEdit')}
                      onClick={() => {
                        setSelectedNews(newsItem)
                        setShowEditModal(true)
                      }}
                    />
                    <AdminIconButton
                      icon={TrashIcon}
                      label={t('news.page.tooltipDelete')}
                      onClick={() => {
                        setSelectedNews(newsItem)
                        setShowDeleteModal(true)
                      }}
                      tone="danger"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminSurface>

      {showAddModal ? <AddNewsModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSave={handleSaveNewNews} /> : null}
      {showEditModal && selectedNews ? (
        <EditNewsModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setSelectedNews(null)
          }}
          news={selectedNews}
          onSave={handleSaveEditNews}
        />
      ) : null}
      {showDeleteModal && selectedNews ? (
        <DeleteNewsModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false)
            setSelectedNews(null)
          }}
          news={selectedNews}
          onConfirm={handleDeleteNews}
        />
      ) : null}
      {showViewModal && selectedNews ? (
        <ViewNewsModal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false)
            setSelectedNews(null)
          }}
          news={selectedNews}
        />
      ) : null}
    </AdminPageShell>
  )
}
