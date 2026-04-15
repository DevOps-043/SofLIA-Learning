'use client'

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Star,
  CheckCircle,
  XCircle,
  Brain,
  Tag
} from 'lucide-react'
import { useAdminSkills } from '../hooks/useAdminSkills'
import {
  AdminSkill,
  CreateSkillData,
  UpdateSkillData
} from '../services/adminSkills.service'
import { SkillModal } from './SkillModal'
import { DeleteSkillModal } from './DeleteSkillModal'

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
  'other'
]

const isStatusFilter = (value: string): value is 'all' | 'active' | 'inactive' => (
  value === 'all' || value === 'active' || value === 'inactive'
)

export function AdminSkillsPage() {
  const { t } = useTranslation('admin')
  const {
    skills,
    isLoading,
    error,
    refetch,
    createSkill,
    updateSkill,
    deleteSkill
  } = useAdminSkills()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all')
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState<AdminSkill | null>(null)
  const [deletingSkill, setDeletingSkill] = useState<AdminSkill | null>(null)

  const filteredSkills = useMemo(() => {
    return skills.filter(skill => {
      const matchesSearch = skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          skill.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          skill.slug.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = selectedCategory === 'all' || skill.category === selectedCategory
      
      const matchesStatus = selectedStatus === 'all' ||
                          (selectedStatus === 'active' && skill.is_active) ||
                          (selectedStatus === 'inactive' && !skill.is_active)
      
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [skills, searchTerm, selectedCategory, selectedStatus])

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
    try {
      if (editingSkill) {
        await updateSkill(editingSkill.skill_id, skillData)
      } else {
        await createSkill(skillData)
      }
      setIsModalOpen(false)
      setEditingSkill(null)
    } catch (error) {
      throw error
    }
  }

  const handleConfirmDelete = async () => {
    if (deletingSkill) {
      try {
        await deleteSkill(deletingSkill.skill_id)
        setIsDeleteModalOpen(false)
        setDeletingSkill(null)
      } catch (error) {
        // Error ya manejado en el hook
      }
    }
  }

  const getSkillIcon = (skill: AdminSkill) => {
    if (skill.icon_url) {
      return (
        <img
          src={skill.icon_url}
          alt={skill.name}
          className="w-8 h-8 rounded"
        />
      )
    }
    if (skill.icon_name) {
      return (
        <div
          className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold text-white"
          style={{ backgroundColor: skill.color || '#3b82f6' }}
        >
          {skill.icon_name.substring(0, 2).toUpperCase()}
        </div>
      )
    }
    return (
      <div
        className="w-8 h-8 rounded flex items-center justify-center"
        style={{ backgroundColor: skill.color || '#3b82f6' }}
      >
        <Brain className="w-4 h-4 text-white" />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <p className="text-red-500 text-lg mb-4">{error}</p>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Gestión de Skills</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Administra las skills disponibles en la plataforma
          </p>
        </div>
        <button
          onClick={handleCreateSkill}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Nueva Skill
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('skills.page.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{t(`skills.categories.${cat}`)}</option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(isStatusFilter(e.target.value) ? e.target.value : 'all')}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activas</option>
              <option value="inactive">Inactivas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Skills</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{skills.length}</p>
            </div>
            <Brain className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Activas</p>
              <p className="text-2xl font-bold text-green-600">
                {skills.filter(s => s.is_active).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Destacadas</p>
              <p className="text-2xl font-bold text-yellow-600">
                {skills.filter(s => s.is_featured).length}
              </p>
            </div>
            <Star className="w-8 h-8 text-yellow-600 fill-yellow-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Resultados</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredSkills.length}</p>
            </div>
            <Filter className="w-8 h-8 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Lista de Skills */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filteredSkills.length === 0 ? (
          <div className="text-center py-12">
            <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
                ? t('skills.page.emptyFiltered')
                : t('skills.page.emptyAll')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Skill
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nivel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredSkills.map((skill, index) => (
                  <motion.tr
                    key={skill.skill_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {getSkillIcon(skill)}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {skill.name}
                            </p>
                            {skill.is_featured && (
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            )}
                          </div>
                          {skill.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                              {skill.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
                        {t(`skills.categories.${skill.category}`, skill.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 capitalize">
                        {skill.level || 'beginner'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {skill.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                          <CheckCircle className="w-3 h-3" />
                          Activa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
                          <XCircle className="w-3 h-3" />
                          Inactiva
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditSkill(skill)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title={t('skills.page.tooltipEdit')}
                        >
                          <Edit className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteSkill(skill)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title={t('skills.page.tooltipDelete')}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modales */}
      {isModalOpen && (
        <SkillModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingSkill(null)
          }}
          skill={editingSkill}
          onSave={handleSaveSkill}
        />
      )}

      {isDeleteModalOpen && deletingSkill && (
        <DeleteSkillModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false)
            setDeletingSkill(null)
          }}
          skill={deletingSkill}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  )
}
