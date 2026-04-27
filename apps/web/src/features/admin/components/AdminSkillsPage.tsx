'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Brain, CheckCircle, Edit, Filter, Search, Star, Trash2, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useAdminTheme } from '../hooks'
import { useAdminSkills } from '../hooks/useAdminSkills'
import type { AdminSkill, CreateSkillData, UpdateSkillData } from '../services/adminSkills.service'
import { DeleteSkillModal } from './DeleteSkillModal'
import { SkillModal } from './SkillModal'
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

const CATEGORIES = [
  'all',
  'general',
  'programming',
  'design',
  'marketing',
  'business',
  'data',
  'ai',
  'cloud',
  'security',
  'devops',
  'leadership',
  'communication',
  'other',
]

const isStatusFilter = (value: string): value is 'all' | 'active' | 'inactive' =>
  value === 'all' || value === 'active' || value === 'inactive'

export function AdminSkillsPage() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const theme = useAdminTheme()
  const { skills, isLoading, error, refetch, createSkill, updateSkill, deleteSkill } = useAdminSkills()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState<AdminSkill | null>(null)
  const [deletingSkill, setDeletingSkill] = useState<AdminSkill | null>(null)

  const normalizedSearch = searchTerm.trim().toLowerCase()
  const filteredSkills = useMemo(() => {
    return skills.filter((skill) => {
      const matchesSearch =
        !normalizedSearch ||
        skill.name.toLowerCase().includes(normalizedSearch) ||
        skill.description?.toLowerCase().includes(normalizedSearch) ||
        skill.slug.toLowerCase().includes(normalizedSearch)
      const matchesCategory = selectedCategory === 'all' || skill.category === selectedCategory
      const matchesStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'active' && skill.is_active) ||
        (selectedStatus === 'inactive' && !skill.is_active)

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [skills, normalizedSearch, selectedCategory, selectedStatus])

  const stats = {
    total: skills.length,
    active: skills.filter((skill) => skill.is_active).length,
    featured: skills.filter((skill) => skill.is_featured).length,
    results: filteredSkills.length,
  }

  const handleCreateSkill = () => {
    setEditingSkill(null)
    setIsModalOpen(true)
  }

  const handleEditSkill = (skill: AdminSkill) => {
    setEditingSkill(skill)
    setIsModalOpen(true)
  }

  const handleDeleteSkill = (skill: AdminSkill) => {
    setDeletingSkill(skill)
    setIsDeleteModalOpen(true)
  }

  const handleSaveSkill = async (skillData: CreateSkillData | UpdateSkillData) => {
    if (editingSkill) {
      await updateSkill(editingSkill.skill_id, skillData)
    } else {
      await createSkill(skillData)
    }

    setIsModalOpen(false)
    setEditingSkill(null)
  }

  const handleConfirmDelete = async () => {
    if (!deletingSkill) return

    await deleteSkill(deletingSkill.skill_id)
    setIsDeleteModalOpen(false)
    setDeletingSkill(null)
  }

  const renderSkillIcon = (skill: AdminSkill) => {
    if (skill.icon_url) {
      return <img src={skill.icon_url} alt={skill.name} className="h-10 w-10 rounded-xl object-cover" />
    }

    return (
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl border text-xs font-bold"
        style={{
          backgroundColor: skill.color || theme.actionSurface,
          borderColor: theme.border,
          color: skill.color ? theme.inverseText : theme.action,
        }}
      >
        {skill.icon_name ? skill.icon_name.substring(0, 2).toUpperCase() : <Brain className="h-5 w-5" />}
      </div>
    )
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
        <div className="py-20 text-center">
          <XCircle className="mx-auto mb-4 h-14 w-14" style={{ color: theme.danger }} />
          <p className="mb-4 text-sm font-medium" style={{ color: theme.danger }}>
            {error}
          </p>
          <AdminButton onClick={refetch}>{tc('actions.retry')}</AdminButton>
        </div>
      </AdminPageShell>
    )
  }

  return (
    <AdminPageShell maxWidth="wide">
      <AdminSectionHeader
        size="page"
        title={t('skills.page.title')}
        description={t('skills.page.description')}
        actions={<AdminButton onClick={handleCreateSkill} icon={Brain} size="lg">{t('skills.page.newSkill')}</AdminButton>}
      />

      <AdminToolbar>
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2"
            style={{ color: theme.textMuted }}
          />
          <AdminInput
            className="pl-10"
            placeholder={t('skills.page.searchPlaceholder')}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto">
          <AdminSelect className="w-full lg:w-56" value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {t(`skills.categories.${category}`)}
              </option>
            ))}
          </AdminSelect>
          <AdminSelect
            className="w-full lg:w-52"
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(isStatusFilter(event.target.value) ? event.target.value : 'all')}
          >
            <option value="all">{t('skills.page.filters.all')}</option>
            <option value="active">{t('skills.page.filters.active')}</option>
            <option value="inactive">{t('skills.page.filters.inactive')}</option>
          </AdminSelect>
        </div>
      </AdminToolbar>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard icon={Brain} label={t('skills.page.stats.total')} tone="primary" value={stats.total} />
        <AdminMetricCard icon={CheckCircle} label={t('skills.page.stats.active')} tone="primary" value={stats.active} />
        <AdminMetricCard icon={Star} label={t('skills.page.stats.featured')} tone="warning" value={stats.featured} />
        <AdminMetricCard icon={Filter} label={t('skills.page.stats.results')} tone="neutral" value={stats.results} />
      </div>

      <AdminTableContainer>
        {filteredSkills.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Brain className="mx-auto mb-4 h-14 w-14" style={{ color: theme.textMuted }} />
            <p className="text-sm" style={{ color: theme.textMuted }}>
              {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
                ? t('skills.page.emptyFiltered')
                : t('skills.page.emptyAll')}
            </p>
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-[820px] w-full text-left">
              <thead>
                <tr style={{ backgroundColor: theme.surfaceSubtle }}>
                  {[
                    t('skills.page.table.skill'),
                    t('skills.page.table.category'),
                    t('skills.page.table.level'),
                    t('skills.page.table.status'),
                    t('skills.page.table.actions'),
                  ].map((heading, index) => (
                    <th
                      key={heading}
                      className={`border-b px-4 py-3 text-xs font-bold uppercase tracking-wider ${index === 4 ? 'text-right' : 'text-left'}`}
                      style={{ borderColor: theme.divider, color: theme.textMuted }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSkills.map((skill, index) => (
                  <motion.tr
                    key={skill.skill_id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.015, 0.18) }}
                    style={{ borderBottom: `1px solid ${theme.divider}` }}
                  >
                    <td className="px-4 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        {renderSkillIcon(skill)}
                        <div className="min-w-0">
                          <div className="flex min-w-0 items-center gap-2">
                            <p className="truncate text-sm font-bold" style={{ color: theme.text }}>
                              {skill.name}
                            </p>
                            {skill.is_featured ? <Star className="h-4 w-4 shrink-0" style={{ color: theme.warning }} /> : null}
                          </div>
                          {skill.description ? (
                            <p className="line-clamp-1 text-xs" style={{ color: theme.textMuted }}>
                              {skill.description}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <AdminStatusBadge tone="primary">
                        {t(`skills.categories.${skill.category}`, { defaultValue: skill.category })}
                      </AdminStatusBadge>
                    </td>
                    <td className="px-4 py-4">
                      <AdminStatusBadge tone="neutral">{skill.level || t('skills.page.defaultLevel')}</AdminStatusBadge>
                    </td>
                    <td className="px-4 py-4">
                      <AdminStatusBadge tone={skill.is_active ? 'primary' : 'neutral'}>
                        {skill.is_active ? t('skills.page.status.active') : t('skills.page.status.inactive')}
                      </AdminStatusBadge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <AdminIconButton icon={Edit} label={t('skills.page.tooltipEdit')} onClick={() => handleEditSkill(skill)} />
                        <AdminIconButton icon={Trash2} label={t('skills.page.tooltipDelete')} onClick={() => handleDeleteSkill(skill)} tone="danger" />
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminTableContainer>

      {isModalOpen ? (
        <SkillModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingSkill(null)
          }}
          skill={editingSkill}
          onSave={handleSaveSkill}
        />
      ) : null}

      {isDeleteModalOpen && deletingSkill ? (
        <DeleteSkillModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false)
            setDeletingSkill(null)
          }}
          skill={deletingSkill}
          onConfirm={handleConfirmDelete}
        />
      ) : null}
    </AdminPageShell>
  )
}
