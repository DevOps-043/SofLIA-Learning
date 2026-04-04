'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import type { AdminCommunityPost } from '../types/admin-community-detail.types'
import type {
  CommunityCommentRecord,
  CommunityPostAttachment,
  CommunityReactionGroup,
} from '../services/adminCommunityContent.helpers'
import { 
  XMarkIcon, 
  UserIcon, 
  CalendarIcon, 
  ChatBubbleLeftIcon,
  HeartIcon,
  PhotoIcon,
  DocumentTextIcon,
  EyeSlashIcon,
  EyeIcon,
  MapPinIcon,
  PaperClipIcon,
  LinkIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'

interface PostDetailLink {
  title?: string | null
  url?: string | null
}

type PostDetailComment = CommunityCommentRecord & {
  reactions?: CommunityReactionGroup[]
}

type PostDetailPost = AdminCommunityPost & {
  attachments?: CommunityPostAttachment[]
  comments?: PostDetailComment[]
  links?: PostDetailLink[]
  post_type?: string | null
  reactions?: CommunityReactionGroup[]
  updated_at?: string | null
  views_count?: number | null
}

interface PostDetailModalProps {
  isOpen: boolean
  onClose: () => void
  post: PostDetailPost | null
}

export function PostDetailModal({ isOpen, onClose, post }: PostDetailModalProps) {
  if (!post) return null

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-gray-800 p-6 text-left align-middle shadow-xl transition-all border border-gray-700">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      {post.is_pinned && (
                        <span className="bg-blue-900/30 text-blue-400 px-2 py-1 rounded text-xs border border-blue-800 flex items-center">
                          <MapPinIcon className="h-3 w-3 mr-1" />
                          Fijado
                        </span>
                      )}
                      {post.is_hidden && (
                        <span className="bg-red-900/30 text-red-400 px-2 py-1 rounded text-xs border border-red-800 flex items-center">
                          <EyeSlashIcon className="h-3 w-3 mr-1" />
                          Oculto
                        </span>
                      )}
                    </div>
                    <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-white mb-2">
                      {post.content ? (post.content.length > 50 ? post.content.substring(0, 50) + '...' : post.content) : 'Post sin contenido'}
                    </Dialog.Title>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <div className="flex items-center space-x-2">
                        {post.users?.profile_picture_url ? (
                          <img 
                            src={post.users.profile_picture_url} 
                            alt="Avatar del autor"
                            className="h-6 w-6 rounded-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              e.currentTarget.nextElementSibling?.classList.remove('hidden')
                            }}
                          />
                        ) : null}
                        <UserIcon className={`h-4 w-4 ${post.users?.profile_picture_url ? 'hidden' : ''}`} />
                        <span>{post.users?.display_name || `${post.users?.first_name} ${post.users?.last_name}` || 'Usuario desconocido'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      </div>
                      {post.is_hidden && (
                        <div className="flex items-center space-x-1 text-yellow-400">
                          <EyeSlashIcon className="h-4 w-4" />
                          <span>Oculto</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Content */}
                <div className="space-y-6">
                  {/* Post Content */}
                  <div className="bg-gray-700/50 p-6 rounded-xl border border-gray-600">
                    <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                      <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-400" />
                      Contenido del Post
                    </h4>
                    <div className="text-gray-300 whitespace-pre-wrap">
                      {post.content || 'Sin contenido'}
                    </div>
                  </div>

                  {/* Post Image */}
                  {post.attachment_url && post.attachment_type?.startsWith('image/') && (
                    <div className="bg-gray-700/50 p-6 rounded-xl border border-gray-600">
                      <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                        <PhotoIcon className="h-5 w-5 mr-2 text-green-400" />
                        Imagen del Post
                      </h4>
                      <div className="flex justify-center">
                        <img 
                          src={post.attachment_url} 
                          alt="Imagen del post"
                          className="max-w-full max-h-96 rounded-lg shadow-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Post Poll/Survey */}
                  {(post.poll_data || 
                    post.content?.toLowerCase().includes('encuesta') || 
                    post.content?.toLowerCase().includes('survey') ||
                    post.content?.toLowerCase().includes('pregunta') ||
                    post.content?.toLowerCase().includes('votar') ||
                    post.content?.toLowerCase().includes('opción') ||
                    post.content?.toLowerCase().includes('opciones')) && (
                    <div className="bg-gray-700/50 p-6 rounded-xl border border-gray-600">
                      <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                        <DocumentTextIcon className="h-5 w-5 mr-2 text-purple-400" />
                        Encuesta
                      </h4>
                      <div className="text-gray-300">
                        {post.poll_data ? (
                          <>
                            <p className="font-medium mb-2">{post.poll_data.question || 'Pregunta de la encuesta'}</p>
                            {post.poll_data.options && (
                              <div className="space-y-2">
                                {post.poll_data.options.map((option: string, index: number) => (
                                  <div key={index} className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-400">{index + 1}.</span>
                                    <span>{option}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-sm text-gray-400 mb-2">Contenido de la encuesta:</p>
                            <div className="bg-gray-600/50 p-4 rounded-lg">
                              <p className="whitespace-pre-wrap text-gray-200">{post.content}</p>
                            </div>
                            
                            {/* Intentar extraer preguntas y opciones del texto */}
                            {post.content && (
                              <div className="mt-4">
                                <h5 className="text-sm font-medium text-white mb-2">Análisis del contenido:</h5>
                                <div className="bg-gray-600/30 p-3 rounded-lg">
                                  {post.content.includes('?') && (
                                    <div className="mb-2">
                                      <span className="text-xs text-green-400">✓ Contiene preguntas</span>
                                    </div>
                                  )}
                                  {(post.content.includes('1.') || post.content.includes('2.') || post.content.includes('a)') || post.content.includes('b)')) && (
                                    <div className="mb-2">
                                      <span className="text-xs text-blue-400">✓ Contiene opciones numeradas</span>
                                    </div>
                                  )}
                                  <div className="text-xs text-gray-400 mt-2">
                                    <p>Este post parece ser una encuesta basada en su contenido. Los datos estructurados no están disponibles.</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            <div className="text-xs text-gray-500">
                              <p>Nota: Esta encuesta no tiene datos estructurados. El contenido se muestra como texto.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Attached Files */}
                  {post.attachments && post.attachments.length > 0 && (
                    <div className="bg-gray-700/50 p-6 rounded-xl border border-gray-600">
                      <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                        <PaperClipIcon className="h-5 w-5 mr-2 text-orange-400" />
                        Archivos Adjuntos
                      </h4>
                      <div className="space-y-2">
                        {post.attachments.map((attachment: CommunityPostAttachment, index: number) => (
                          <div key={index} className="flex items-center space-x-3 p-3 bg-gray-600/50 rounded-lg">
                            <PaperClipIcon className="h-5 w-5 text-orange-400" />
                            <div className="flex-1">
                              <p className="text-white font-medium">{attachment.name || `Archivo ${index + 1}`}</p>
                              <p className="text-gray-400 text-sm">{attachment.type || 'Tipo desconocido'}</p>
                            </div>
                            <a 
                              href={attachment.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              Descargar
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Links */}
                  {post.links && post.links.length > 0 && (
                    <div className="bg-gray-700/50 p-6 rounded-xl border border-gray-600">
                      <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                        <LinkIcon className="h-5 w-5 mr-2 text-cyan-400" />
                        Enlaces
                      </h4>
                      <div className="space-y-2">
                        {post.links.map((link: PostDetailLink, index: number) => (
                          <div key={index} className="flex items-center space-x-3 p-3 bg-gray-600/50 rounded-lg">
                            <LinkIcon className="h-5 w-5 text-cyan-400" />
                            <div className="flex-1">
                              <p className="text-white font-medium">{link.title || `Enlace ${index + 1}`}</p>
                              <p className="text-gray-400 text-sm break-all">{link.url}</p>
                            </div>
                            <a 
                              href={link.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-cyan-400 hover:text-cyan-300 transition-colors"
                            >
                              Abrir
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reactions */}
                  {post.reactions && post.reactions.length > 0 && (
                    <div className="bg-gray-700/50 p-6 rounded-xl border border-gray-600">
                      <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                        <HeartIcon className="h-5 w-5 mr-2 text-pink-400" />
                        Reacciones
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {post.reactions.map((reaction: CommunityReactionGroup, index: number) => (
                          <div key={index} className="flex items-center space-x-2 p-2 bg-gray-600/50 rounded-lg">
                            <span className="text-lg">{reaction.emoji || '👍'}</span>
                            <span className="text-white font-medium">{reaction.count || 0}</span>
                            <span className="text-gray-400 text-sm">{reaction.type || 'Me gusta'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Comments */}
                  {post.comments && post.comments.length > 0 && (
                    <div className="bg-gray-700/50 p-6 rounded-xl border border-gray-600">
                      <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                        <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2 text-indigo-400" />
                        Comentarios ({post.comments.length})
                      </h4>
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {post.comments.map((comment: PostDetailComment, index: number) => (
                          <div key={index} className="p-4 bg-gray-600/50 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              {comment.users?.profile_picture_url ? (
                                <img 
                                  src={comment.users.profile_picture_url} 
                                  alt="Avatar del comentarista"
                                  className="h-4 w-4 rounded-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                                  }}
                                />
                              ) : null}
                              <UserIcon className={`h-4 w-4 text-gray-400 ${comment.users?.profile_picture_url ? 'hidden' : ''}`} />
                              <span className="text-white font-medium">
                                {comment.users?.display_name || `${comment.users?.first_name} ${comment.users?.last_name}` || 'Usuario'}
                              </span>
                              <span className="text-gray-400 text-sm">
                                {new Date(comment.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-gray-300">{comment.content}</p>
                            {comment.reactions && comment.reactions.length > 0 && (
                              <div className="flex items-center space-x-2 mt-2">
                                {comment.reactions.map((reaction: CommunityReactionGroup, rIndex: number) => (
                                  <span key={rIndex} className="text-sm text-gray-400">
                                    {reaction.emoji} {reaction.count}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                      <div className="flex items-center space-x-2 text-gray-300">
                        <HeartIcon className="h-5 w-5 text-red-400" />
                        <span className="font-medium">{post.likes_count || 0} Me gusta</span>
                      </div>
                    </div>
                    <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                      <div className="flex items-center space-x-2 text-gray-300">
                        <ChatBubbleLeftIcon className="h-5 w-5 text-blue-400" />
                        <span className="font-medium">{post.comments_count || 0} Comentarios</span>
                      </div>
                    </div>
                    <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                      <div className="flex items-center space-x-2 text-gray-300">
                        <EyeIcon className="h-5 w-5 text-green-400" />
                        <span className="font-medium">{post.views_count || 0} Visualizaciones</span>
                      </div>
                    </div>
                  </div>

                  {/* Post Metadata */}
                  <div className="bg-gray-700/50 p-6 rounded-xl border border-gray-600">
                    <h4 className="text-lg font-semibold text-white mb-3">Información Técnica</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">ID del Post:</span>
                        <span className="text-white ml-2 font-mono">{post.id}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Tipo:</span>
                        <span className="text-white ml-2">{post.post_type || 'texto'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Creado:</span>
                        <span className="text-white ml-2">{new Date(post.created_at).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Actualizado:</span>
                        <span className="text-white ml-2">{new Date(post.updated_at).toLocaleString()}</span>
                      </div>
                    </div>
                    
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={onClose}
                    className="inline-flex justify-center rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
