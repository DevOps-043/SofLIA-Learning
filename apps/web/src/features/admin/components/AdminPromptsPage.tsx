'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import {
  EyeIcon,
  EyeSlashIcon,
  FunnelIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  PlusIcon,
  StarIcon,
  TagIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

import { useAdminTheme } from '../hooks'
import { useAdminPrompts } from '../hooks/useAdminPrompts'
import type { AdminPrompt } from '../services/adminPrompts.service'
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

const AddPromptModal = dynamic(() => import('./AddPromptModal').then((mod) => ({ default: mod.AddPromptModal })), {
  ssr: false,
})
const EditPromptModal = dynamic(() => import('./EditPromptModal').then((mod) => ({ default: mod.EditPromptModal })), {
  ssr: false,
})
const DeletePromptModal = dynamic(() => import('./DeletePromptModal').then((mod) => ({ default: mod.DeletePromptModal })), {
  ssr: false,
})
const ViewPromptModal = dynamic(() => import('./ViewPromptModal').then((mod) => ({ default: mod.ViewPromptModal })), {
  ssr: false,
})

const statusFilters = ['all', 'active', 'inactive', 'featured']

function getPromptTags(tags: AdminPrompt['tags']) {
  if (Array.isArray(tags)) return tags
  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
  }
  return []
}

function getDifficultyTone(level: string) {
  switch (level.toLowerCase()) {
    case 'advanced':
      return 'danger' as const
    case 'intermediate':
      return 'warning' as const
    case 'beginner':
      return 'primary' as const
    default:
      return 'neutral' as const
  }
}

export function AdminPromptsPage() {
  const {
    prompts,
    stats,
    isLoading,
    error,
    refetch,
    createPrompt,
    updatePrompt,
    deletePrompt,
    togglePromptStatus,
    togglePromptFeatured,
  } = useAdminPrompts()

  const theme = useAdminTheme()
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedPrompt, setSelectedPrompt] = useState<AdminPrompt | null>(null)

  const normalizedSearch = searchTerm.trim().toLowerCase()
  const filteredPrompts = prompts.filter((prompt) => {
    const tags = getPromptTags(prompt.tags).join(' ').toLowerCase()
    const matchesSearch =
      !normalizedSearch ||
      prompt.title.toLowerCase().includes(normalizedSearch) ||
      prompt.description.toLowerCase().includes(normalizedSearch) ||
      tags.includes(normalizedSearch)
    const matchesCategory = selectedCategory === 'all' || prompt.category_id === selectedCategory
    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'active' && prompt.is_active) ||
      (selectedStatus === 'inactive' && !prompt.is_active) ||
      (selectedStatus === 'featured' && prompt.is_featured)

    return matchesSearch && matchesCategory && matchesStatus
  })

  const handleDeletePrompt = async (prompt: AdminPrompt) => {
    try {
      setIsProcessing(prompt.prompt_id)
      await deletePrompt(prompt.prompt_id)
      setIsDeleteModalOpen(false)
      setSelectedPrompt(null)
    } finally {
      setIsProcessing(null)
    }
  }

  const handleSaveNewPrompt = async (promptData: Partial<AdminPrompt>) => {
    await createPrompt(promptData)
  }

  const handleSaveEditPrompt = async (promptId: string, promptData: Partial<AdminPrompt>) => {
    await updatePrompt(promptId, promptData)
  }

  const handleToggleStatus = async (prompt: AdminPrompt) => {
    try {
      setIsProcessing(prompt.prompt_id)
      await togglePromptStatus(prompt.prompt_id, !prompt.is_active)
    } finally {
      setIsProcessing(null)
    }
  }

  const handleToggleFeatured = async (prompt: AdminPrompt) => {
    try {
      setIsProcessing(prompt.prompt_id)
      await togglePromptFeatured(prompt.prompt_id, !prompt.is_featured)
    } finally {
      setIsProcessing(null)
    }
  }

  if (isLoading) {
    return (
      <AdminPageShell maxWidth="wide">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" style={{ color: theme.action }} />
            <p className="text-sm font-medium" style={{ color: theme.textMuted }}>
              {t('prompts.page.loading')}
            </p>
          </div>
        </div>
      </AdminPageShell>
    )
  }

  if (error) {
    return (
      <AdminPageShell maxWidth="wide">
        <AdminSurface className="p-6 text-center">
          <p className="text-sm font-medium" style={{ color: theme.danger }}>
            {t('prompts.page.loadError', { error })}
          </p>
          <AdminButton className="mt-4" onClick={refetch}>
            {tc('actions.retry')}
          </AdminButton>
        </AdminSurface>
      </AdminPageShell>
    )
  }

  return (
    <AdminPageShell maxWidth="wide">
      <AdminSectionHeader
        size="page"
        title={t('prompts.page.title')}
        description={t('prompts.page.description')}
        actions={
          <AdminButton onClick={() => setIsAddModalOpen(true)} icon={PlusIcon} size="lg">
            {t('prompts.page.add')}
          </AdminButton>
        }
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard icon={TagIcon} label={t('prompts.page.stats.total')} tone="primary" value={stats.totalPrompts} />
        <AdminMetricCard icon={HeartIcon} label={t('prompts.page.stats.likes')} tone="info" value={stats.totalLikes.toLocaleString()} />
        <AdminMetricCard icon={EyeIcon} label={t('prompts.page.stats.views')} tone="neutral" value={stats.totalViews.toLocaleString()} />
        <AdminMetricCard icon={StarIcon} label={t('prompts.page.stats.featured')} tone="primary" value={stats.featuredPrompts} />
      </div>

      <AdminToolbar>
        <div className="relative flex-1">
          <MagnifyingGlassIcon
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2"
            style={{ color: theme.textMuted }}
          />
          <AdminInput
            className="pl-10"
            placeholder={t('prompts.page.searchPlaceholder')}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto">
          <div className="relative">
            <FunnelIcon
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2"
              style={{ color: theme.textMuted }}
            />
            <AdminSelect className="w-full pl-10 lg:w-56" value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
              <option value="all">{t('prompts.page.allCategories')}</option>
            </AdminSelect>
          </div>
          <AdminSelect className="w-full lg:w-52" value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)}>
            {statusFilters.map((status) => (
              <option key={status} value={status}>
                {t(`prompts.page.filters.${status}`)}
              </option>
            ))}
          </AdminSelect>
        </div>
      </AdminToolbar>

      {filteredPrompts.length === 0 ? (
        <AdminSurface className="px-6 py-12 text-center">
          <TagIcon className="mx-auto h-12 w-12" style={{ color: theme.textMuted }} />
          <p className="mt-4 text-sm font-medium" style={{ color: theme.textMuted }}>
            {t('prompts.page.empty')}
          </p>
        </AdminSurface>
      ) : (
        <div className="space-y-4">
          {filteredPrompts.map((prompt) => {
            const tags = getPromptTags(prompt.tags)
            const authorName = prompt.author?.display_name || prompt.author?.first_name || t('prompts.page.unknownAuthor')

            return (
              <AdminSurface key={prompt.prompt_id} className="p-5" interactive>
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <AdminStatusBadge tone={prompt.is_active ? 'primary' : 'neutral'}>
                        {prompt.is_active ? t('prompts.page.status.active') : t('prompts.page.status.inactive')}
                      </AdminStatusBadge>
                      {prompt.is_featured ? <AdminStatusBadge tone="warning">{t('prompts.page.status.featured')}</AdminStatusBadge> : null}
                      <AdminStatusBadge tone={getDifficultyTone(prompt.difficulty_level)}>{prompt.difficulty_level}</AdminStatusBadge>
                    </div>

                    <div className="flex min-w-0 gap-4">
                      <div
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border"
                        style={{ backgroundColor: theme.actionSurface, borderColor: theme.border, color: theme.action }}
                      >
                        <TagIcon className="h-7 w-7" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="truncate text-xl font-bold" style={{ color: theme.text }}>
                          {prompt.title}
                        </h2>
                        <p className="mt-2 line-clamp-2 text-sm leading-6" style={{ color: theme.textMuted }}>
                          {prompt.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {tags.length ? (
                        tags.slice(0, 8).map((tag) => (
                          <span key={tag} className="rounded-full border px-3 py-1 text-xs font-medium" style={{ borderColor: theme.border, color: theme.textMuted }}>
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm" style={{ color: theme.textMuted }}>
                          {t('prompts.page.noTags')}
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm" style={{ color: theme.textMuted }}>
                      <span>{authorName}</span>
                      <span>{prompt.category?.name || t('prompts.page.uncategorized')}</span>
                      <span>{new Date(prompt.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-4 xl:items-end">
                    <div className="flex items-center gap-4 text-sm" style={{ color: theme.textMuted }}>
                      <span className="inline-flex items-center gap-1"><HeartIcon className="h-4 w-4" />{prompt.like_count}</span>
                      <span className="inline-flex items-center gap-1"><EyeIcon className="h-4 w-4" />{prompt.view_count}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                      <AdminIconButton
                        label={prompt.is_active ? t('prompts.page.actions.deactivate') : t('prompts.page.actions.activate')}
                        onClick={() => handleToggleStatus(prompt)}
                        disabled={isProcessing === prompt.prompt_id}
                        icon={EyeSlashIcon}
                      />
                      <AdminIconButton
                        label={prompt.is_featured ? t('prompts.page.actions.unfeature') : t('prompts.page.actions.feature')}
                        onClick={() => handleToggleFeatured(prompt)}
                        disabled={isProcessing === prompt.prompt_id}
                        icon={StarIcon}
                        tone="warning"
                      />
                      <AdminIconButton
                        label={tc('actions.viewDetails')}
                        onClick={() => {
                          setSelectedPrompt(prompt)
                          setIsViewModalOpen(true)
                        }}
                        icon={EyeIcon}
                        tone="neutral"
                      />
                      <AdminIconButton
                        label={tc('actions.edit')}
                        onClick={() => {
                          setSelectedPrompt(prompt)
                          setIsEditModalOpen(true)
                        }}
                        icon={PencilIcon}
                      />
                      <AdminIconButton
                        label={tc('actions.delete')}
                        onClick={() => {
                          setSelectedPrompt(prompt)
                          setIsDeleteModalOpen(true)
                        }}
                        icon={TrashIcon}
                        tone="danger"
                      />
                    </div>
                  </div>
                </div>
              </AdminSurface>
            )
          })}
        </div>
      )}

      <AddPromptModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSave={handleSaveNewPrompt} />
      <EditPromptModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedPrompt(null)
        }}
        onSave={handleSaveEditPrompt}
        prompt={selectedPrompt}
      />
      <DeletePromptModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setSelectedPrompt(null)
        }}
        onConfirm={handleDeletePrompt}
        prompt={selectedPrompt}
        isDeleting={isProcessing === selectedPrompt?.prompt_id}
      />
      <ViewPromptModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedPrompt(null)
        }}
        prompt={selectedPrompt}
      />
    </AdminPageShell>
  )
}
