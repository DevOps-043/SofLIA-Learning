'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Flag, 
  Share2,
  Copy,
  Check
} from 'lucide-react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useUserRole } from '@/core/hooks/useUserRole'
import { ConfirmDeleteModal } from '../ConfirmDeleteModal'
import { ReportPostModal } from '../ReportPostModal'

interface PostMenuProps {
  post: {
    id: string
    user_id?: string
    author_id?: string
    community_id: string
    is_pinned?: boolean
    is_hidden?: boolean
    content?: string
    title?: string | null
    attachment_url?: string | null
    attachment_type?: string | null
    attachment_data?: Record<string, unknown>
  }
  communitySlug: string
  onEdit?: () => void
  onDelete?: () => void
  onShare?: () => void
  onPostUpdate?: () => void
}

export function PostMenu({ 
  post, 
  communitySlug,
  onEdit,
  onDelete,
  onShare,
  onPostUpdate
}: PostMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { user } = useAuth()
  const { isAdmin, isInstructor } = useUserRole()

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const isAuthor = user && (post.user_id === user.id || post.author_id === user.id)
  const canModerate = isAdmin || isInstructor // Los instructores pueden moderar en sus comunidades

  const handleCopyLink = async () => {
    // Usar el ID del post para la URL
    const postUrl = `${window.location.origin}/communities/${communitySlug}/posts/${post.id}`
    try {
      await navigator.clipboard.writeText(postUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      setIsOpen(false)
    } catch (error) {
      console.error('Error copying link:', error)
    }
  }

  const handleReport = () => {
    setIsOpen(false)
    setShowReportModal(true)
  }

  const handleDeleteClick = () => {
    setIsOpen(false)
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    if (!isAuthor && !canModerate) return

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/communities/${communitySlug}/posts/${post.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        setShowDeleteConfirm(false)
        onDelete?.()
        onPostUpdate?.()
      } else {
        const error = await response.json()
        alert(error.message || 'Error al eliminar el post')
        setShowDeleteConfirm(false)
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Error al eliminar el post')
      setShowDeleteConfirm(false)
    } finally {
      setIsProcessing(false)
    }
  }

  const menuItems = []

  // Opciones para el autor
  if (isAuthor) {
    menuItems.push(
      {
        label: 'Editar post',
        icon: Edit,
        action: () => {
          setIsOpen(false)
          onEdit?.()
        },
        color: 'text-blue-400'
      },
      {
        label: 'Eliminar post',
        icon: Trash2,
        action: handleDeleteClick,
        color: 'text-red-400',
        destructive: true
      }
    )
  }

  // Opciones para todos los usuarios
  menuItems.push(
    {
      label: 'Copiar enlace',
      icon: copied ? Check : Copy,
      action: handleCopyLink,
      color: copied ? 'text-green-400' : 'text-slate-300'
    }
  )

  if (onShare) {
    menuItems.push({
      label: 'Compartir',
      icon: Share2,
      action: () => {
        setIsOpen(false)
        onShare()
      },
      color: 'text-green-400'
    })
  }

  // Opciones de moderación
  if (canModerate && !isAuthor) {
    menuItems.push(
      {
        label: 'Eliminar post',
        icon: Trash2,
        action: handleDeleteClick,
        color: 'text-red-400',
        destructive: true,
        disabled: isProcessing
      }
    )
  }

  // Opción de reportar (solo si no es el autor)
  if (!isAuthor && user) {
    menuItems.push({
      label: 'Reportar post',
      icon: Flag,
      action: handleReport,
      color: 'text-red-400'
    })
  }

  // Siempre mostrar al menos "Copiar enlace" si hay communitySlug
  // Si no hay opciones, aún así mostrar el botón con solo "Copiar enlace"

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        disabled={isProcessing}
        className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700/50"
        aria-label="Opciones del post"
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-[100] min-w-[180px] overflow-hidden"
          >
            <div className="py-1">
              {menuItems.map((item, index) => {
                const Icon = item.icon
                return (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={item.action}
                    disabled={item.disabled || isProcessing}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      item.destructive
                        ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
                        : `hover:bg-slate-700 ${item.color || 'text-slate-200'}`
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de confirmación de eliminación */}
      <ConfirmDeleteModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        message={
          isAuthor 
            ? '¿Estás seguro de que quieres eliminar este post? Esta acción no se puede deshacer.'
            : '¿Estás seguro de que quieres eliminar este post como moderador? Esta acción no se puede deshacer.'
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        isLoading={isProcessing}
      />

      {/* Modal de reporte */}
      <ReportPostModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        postId={post.id}
        communitySlug={communitySlug}
        onSuccess={() => {
          // Opcional: mostrar notificación o actualizar UI
        }}
      />
    </div>
  )
}

