import React, { useMemo, useState } from 'react'
import { OrganizationNode } from '../../types/dynamicHierarchy.types'
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Edit3,
  Trash2,
  MapPin,
  Users,
  Building2,
  Folder,
  Hash,
  User
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'

interface NodeItemProps {
  node: OrganizationNode
  level: number
  onExpand?: (node: OrganizationNode) => void
  onCollapse?: (node: OrganizationNode) => void
  onEdit?: (node: OrganizationNode) => void
  onDelete?: (node: OrganizationNode) => void
  onAddChild?: (parentNode: OrganizationNode) => void
}

export const NodeItem: React.FC<NodeItemProps> = ({
  node,
  level,
  onExpand,
  onCollapse,
  onAddChild,
  onEdit,
  onDelete
}) => {
  const params = useParams()
  const theme = useBusinessPanelTheme()
  const { t } = useTranslation('business')
  const { t: tc } = useTranslation('common')
  const [isExpanded, setIsExpanded] = useState(level === 0)

  const indentSize = 32
  const paddingLeft = level * indentSize
  const isRootExpanded = isExpanded && level === 0

  const nodeTypeStyle = useMemo(() => {
    switch (node.type) {
      case 'root':
        return { color: theme.successColor, Icon: Building2 }
      case 'region':
        return { color: theme.chartColors[1], Icon: MapPin }
      case 'zone':
        return { color: theme.secondaryColor, Icon: Hash }
      case 'team':
        return { color: theme.warningColor, Icon: Users }
      default:
        return { color: theme.mutedTextColor, Icon: Folder }
    }
  }, [node.type, theme.chartColors, theme.mutedTextColor, theme.secondaryColor, theme.successColor, theme.warningColor])

  const handleToggle = () => {
    const newState = !isExpanded
    setIsExpanded(newState)
    if (newState && onExpand) onExpand(node)
    if (!newState && onCollapse) onCollapse(node)
  }

  return (
    <div className="flex flex-col">
      <motion.div
        whileHover={{ backgroundColor: theme.hoverBg }}
        className="group flex items-center py-2 px-4 rounded-2xl transition-all duration-300 relative"
        style={{
          marginLeft: `${paddingLeft}px`,
          backgroundColor: isRootExpanded ? theme.inputBg : 'transparent'
        }}
      >
        {level > 0 ? (
          <div
            className="absolute top-0 bottom-0 -left-[16px] w-px transition-colors"
            style={{ backgroundColor: theme.borderColor }}
          />
        ) : null}

        <button
          onClick={handleToggle}
          className="shrink-0 w-6 h-6 flex items-center justify-center rounded-lg transition-all"
          style={{ color: isExpanded ? theme.primaryColor : theme.mutedTextColor }}
        >
          {node.children && node.children.length > 0 ? (
            isExpanded ? <ChevronDown size={14} strokeWidth={3} /> : <ChevronRight size={14} strokeWidth={3} />
          ) : (
            <div className="w-1 h-1 rounded-full bg-current opacity-60" />
          )}
        </button>

        <div className="flex-1 flex items-center gap-4 min-w-0">
          <div
            className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border transition-all"
            style={{
              backgroundColor: theme.inputBg,
              borderColor: isExpanded ? `${theme.primaryColor}20` : theme.borderColor,
              boxShadow: isExpanded ? `0 12px 28px -16px ${theme.primaryColor}80` : 'none'
            }}
          >
            <nodeTypeStyle.Icon size={18} style={{ color: nodeTypeStyle.color }} />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-3">
              <Link
                href={`/${params?.orgSlug}/business-panel/hierarchy/node/${node.id}`}
                className="text-sm font-black transition-colors truncate tracking-tight"
                style={{ color: theme.textColor }}
              >
                {node.name}
              </Link>
              {node.code ? (
                <span
                  className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border"
                  style={{
                    color: theme.primaryColor,
                    backgroundColor: `${theme.primaryColor}10`,
                    borderColor: `${theme.primaryColor}20`
                  }}
                >
                  {node.code}
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-3 text-[10px] font-medium truncate" style={{ color: theme.mutedTextColor }}>
              <span className="uppercase tracking-[0.1em] font-black">{node.type}</span>
              {node.manager ? (
                <div className="flex items-center gap-1.5 pl-3 border-l" style={{ borderColor: theme.borderColor }}>
                  <User size={10} style={{ color: theme.primaryColor }} />
                  <span className="truncate">{t('hierarchy.leaderLabel')}: {node.manager.first_name}</span>
                </div>
              ) : null}
              <div className="flex items-center gap-1.5 pl-3 border-l" style={{ borderColor: theme.borderColor }}>
                <Users size={10} />
                <span>{t('hierarchy.membersCount', { count: node.members_count || 0 })}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
          <button
            onClick={() => onAddChild && onAddChild(node)}
            className="p-2 rounded-xl transition-all"
            style={{ color: theme.mutedTextColor, backgroundColor: 'transparent' }}
            onMouseEnter={(event) => {
              event.currentTarget.style.color = theme.primaryColor
              event.currentTarget.style.backgroundColor = `${theme.primaryColor}12`
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.color = theme.mutedTextColor
              event.currentTarget.style.backgroundColor = 'transparent'
            }}
            title={t('hierarchy.addSubLevel')}
          >
            <Plus size={16} strokeWidth={3} />
          </button>
          <button
            onClick={() => onEdit && onEdit(node)}
            className="p-2 rounded-xl transition-all"
            style={{ color: theme.mutedTextColor, backgroundColor: 'transparent' }}
            onMouseEnter={(event) => {
              event.currentTarget.style.color = theme.textColor
              event.currentTarget.style.backgroundColor = theme.hoverBg
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.color = theme.mutedTextColor
              event.currentTarget.style.backgroundColor = 'transparent'
            }}
            title={tc('actions.edit')}
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={() => onDelete && onDelete(node)}
            className="p-2 rounded-xl transition-all"
            style={{ color: theme.mutedTextColor, backgroundColor: 'transparent' }}
            onMouseEnter={(event) => {
              event.currentTarget.style.color = theme.dangerColor
              event.currentTarget.style.backgroundColor = `${theme.dangerColor}12`
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.color = theme.mutedTextColor
              event.currentTarget.style.backgroundColor = 'transparent'
            }}
            title={tc('actions.delete')}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {isExpanded && node.children && node.children.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden flex flex-col pt-1"
          >
            {node.children.map(child => (
              <NodeItem
                key={child.id}
                node={child}
                level={level + 1}
                onExpand={onExpand}
                onCollapse={onCollapse}
                onAddChild={onAddChild}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {isExpanded && (!node.children || node.children.length === 0) ? (
        <div className="py-2 flex items-center gap-3" style={{ marginLeft: `${paddingLeft + indentSize + 12}px`, color: theme.mutedTextColor }}>
          <div className="w-4 h-px bg-current shrink-0" />
          <span className="text-[10px] font-black uppercase tracking-widest italic">{t('hierarchy.terminalLevel')}</span>
        </div>
      ) : null}
    </div>
  )
}
