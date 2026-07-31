import type { CSSProperties } from 'react'
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
import { getHierarchyTypeLabel } from './hierarchy-labels'
import styles from './HierarchyExperience.module.css'

type NodeRowVariables = CSSProperties & {
  '--node-accent': string
  '--node-depth': number
}

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
    <div className={styles.nodeBranch}>
      <motion.div
        className={styles.nodeRow}
        style={{
          '--node-accent': nodeTypeStyle.color,
          '--node-depth': level,
        } as NodeRowVariables}
      >
        {level > 0 ? <span className={styles.nodeConnector} aria-hidden="true" /> : null}

        <button
          type="button"
          onClick={handleToggle}
          className={styles.nodeToggle}
          aria-expanded={node.children?.length ? isExpanded : undefined}
          aria-label={node.children?.length ? `${isExpanded ? 'Contraer' : 'Expandir'} ${node.name}` : node.name}
        >
          {node.children && node.children.length > 0 ? (
            isExpanded ? <ChevronDown aria-hidden="true" /> : <ChevronRight aria-hidden="true" />
          ) : (
            <nodeTypeStyle.Icon aria-hidden="true" />
          )}
        </button>

        <div className={styles.nodeMain}>
          <div className={styles.nodeTitleLine}>
            <Link
              href={`/${params?.orgSlug}/business-panel/hierarchy/node/${node.id}`}
              className={styles.nodeTitle}
            >
              {node.name}
            </Link>
            {node.code ? <span className={styles.nodeCode}>{node.code}</span> : null}
          </div>

          <div className={styles.nodeMeta}>
            <span className={styles.nodeType}>{getHierarchyTypeLabel(node.type, t)}</span>
            {node.manager ? (
              <span className={styles.nodeMetaItem}>
                <User aria-hidden="true" />
                <span>{t('hierarchy.leaderLabel')}: {node.manager.first_name}</span>
              </span>
            ) : null}
            <span className={styles.nodeMetaItem}>
              <Users aria-hidden="true" />
              <span>{t('hierarchy.membersCount', { count: node.members_count || 0 })}</span>
            </span>
          </div>
        </div>

        <div className={styles.nodeActions}>
          <button
            type="button"
            onClick={() => onAddChild && onAddChild(node)}
            className={styles.iconButton}
            aria-label={`${t('hierarchy.addSubLevel')}: ${node.name}`}
          >
            <Plus aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onEdit && onEdit(node)}
            className={styles.iconButton}
            aria-label={`${tc('actions.edit')}: ${node.name}`}
          >
            <Edit3 aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onDelete && onDelete(node)}
            className={styles.dangerIconButton}
            aria-label={`${tc('actions.delete')}: ${node.name}`}
          >
            <Trash2 aria-hidden="true" />
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {isExpanded && node.children && node.children.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={styles.nodeChildren}
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
        <div className={styles.terminalLabel}>{t('hierarchy.terminalLevel')}</div>
      ) : null}
    </div>
  )
}
