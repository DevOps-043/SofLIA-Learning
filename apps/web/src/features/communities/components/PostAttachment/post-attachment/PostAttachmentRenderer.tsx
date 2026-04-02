'use client'

import NextImage from 'next/image'
import {
  Download,
  ExternalLink,
  FileText,
  Image,
  Link,
  Youtube,
} from 'lucide-react'
import { ImageModal } from '../../ImageModal'
import {
  buildYouTubeEmbedUrl,
  extractYouTubeVideoId,
  formatFileSize,
} from './service'

interface PostAttachmentRendererProps {
  attachmentType: string
  attachmentUrl: string
  attachmentData?: any
  showImageModal: boolean
  onOpenImage: () => void
  onCloseImage: () => void
}

export function PostAttachmentRenderer({
  attachmentType,
  attachmentUrl,
  attachmentData,
  showImageModal,
  onOpenImage,
  onCloseImage,
}: PostAttachmentRendererProps) {
  if (attachmentType === 'image') {
    const isBase64 = attachmentUrl.startsWith('data:')

    if (isBase64) {
      const base64Regex =
        /^data:image\/(jpeg|jpg|png|gif|webp|svg\+xml);base64,/
      if (!base64Regex.test(attachmentUrl)) {
        return (
          <div className="w-full h-48 bg-slate-700 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Image className="w-12 h-12 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">Imagen no vÃ¡lida</p>
            </div>
          </div>
        )
      }
    }

    return (
      <>
        <div className="relative group w-full max-h-96">
          <NextImage
            src={attachmentUrl}
            alt={attachmentData?.name || 'Imagen adjunta'}
            width={800}
            height={600}
            className="w-full max-h-96 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={onOpenImage}
            priority={false}
            quality={85}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 800px"
          />
        </div>

        <ImageModal
          isOpen={showImageModal}
          onClose={onCloseImage}
          imageUrl={attachmentUrl}
          imageName={attachmentData?.name}
          imageData={attachmentData}
        />
      </>
    )
  }

  if (attachmentType === 'video') {
    const isYouTubeUrl =
      attachmentUrl.includes('youtube.com/embed/') ||
      attachmentUrl.includes('youtu.be/') ||
      attachmentUrl.includes('youtube.com/watch')

    if (isYouTubeUrl) {
      const embedUrl = buildYouTubeEmbedUrl(
        extractYouTubeVideoId(attachmentUrl, attachmentData),
      )

      return (
        <div className="bg-gray-100 dark:bg-slate-800/50 border border-gray-300 dark:border-slate-700 rounded-lg overflow-hidden">
          {embedUrl ? (
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={embedUrl}
                title="Video de YouTube"
                className="absolute top-0 left-0 w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="w-full h-48 bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
              <div className="text-center">
                <Youtube className="w-12 h-12 text-gray-600 dark:text-slate-400 mx-auto mb-2" />
                <p className="text-gray-700 dark:text-slate-400 text-sm mb-3">
                  No se pudo extraer videoId
                </p>
                <button
                  onClick={() => window.open(attachmentUrl, '_blank')}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2 mx-auto"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ver en YouTube
                </button>
              </div>
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="relative group">
        <video
          src={attachmentUrl}
          controls
          className="w-full max-h-96 rounded-lg"
          poster={attachmentData?.thumbnail}
        />
        <div className="absolute top-2 right-2 bg-black/50 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Download
            className="w-4 h-4 text-white cursor-pointer"
            onClick={() => {
              const link = document.createElement('a')
              link.href = attachmentUrl
              link.download = attachmentData?.name || 'video'
              link.click()
            }}
          />
        </div>
      </div>
    )
  }

  if (attachmentType === 'document') {
    const isExternalUrl = attachmentUrl.startsWith('http')

    return (
      <div
        className="bg-gray-100 dark:bg-slate-800/50 border border-gray-300 dark:border-slate-700 rounded-lg p-4 hover:bg-gray-200 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
        onClick={() => {
          if (isExternalUrl) {
            window.open(attachmentUrl, '_blank')
            return
          }
          const link = document.createElement('a')
          link.href = attachmentUrl
          link.download = attachmentData?.name || 'documento'
          link.click()
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 dark:text-white truncate">
              {attachmentData?.name || 'Documento'}
            </h4>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              {attachmentData?.size
                ? formatFileSize(attachmentData.size)
                : 'Documento adjunto'}
            </p>
          </div>
          <ExternalLink className="w-5 h-5 text-gray-600 dark:text-slate-400" />
        </div>
      </div>
    )
  }

  if (attachmentType === 'youtube') {
    const embedUrl = buildYouTubeEmbedUrl(
      extractYouTubeVideoId(attachmentUrl, attachmentData),
    )

    return (
      <div className="bg-gray-100 dark:bg-slate-800/50 border border-gray-300 dark:border-slate-700 rounded-lg overflow-hidden">
        {embedUrl ? (
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={embedUrl}
              title={attachmentData?.title || 'Video de YouTube'}
              className="absolute top-0 left-0 w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="w-full h-48 bg-slate-700 flex items-center justify-center">
            <div className="text-center">
              <Youtube className="w-12 h-12 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-400 text-sm mb-3">
                No se pudo cargar el video
              </p>
              <button
                onClick={() => window.open(attachmentUrl, '_blank')}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2 mx-auto"
              >
                <ExternalLink className="w-4 h-4" />
                Ver en YouTube
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (attachmentType === 'link') {
    if (attachmentData?.isYouTube) {
      const embedUrl = buildYouTubeEmbedUrl(
        extractYouTubeVideoId(attachmentUrl, attachmentData),
      )

      return (
        <div className="bg-gray-100 dark:bg-slate-800/50 border border-gray-300 dark:border-slate-700 rounded-lg overflow-hidden">
          {embedUrl ? (
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={embedUrl}
                className="absolute top-0 left-0 w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={attachmentData?.title || 'Video de YouTube'}
              />
            </div>
          ) : (
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                  <Youtube className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                    {attachmentData?.title || 'Video de YouTube'}
                  </h4>
                </div>
              </div>
            </div>
          )}
        </div>
      )
    }

    return (
      <div
        className="bg-gray-100 dark:bg-slate-800/50 border border-gray-300 dark:border-slate-700 rounded-lg p-4 hover:bg-gray-200 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
        onClick={() => window.open(attachmentUrl, '_blank')}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
            <Link className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 dark:text-white mb-1">
              {attachmentData?.title || 'Enlace web'}
            </h4>
            <p className="text-sm text-gray-600 dark:text-slate-400 truncate">
              {attachmentUrl}
            </p>
          </div>
          <ExternalLink className="w-5 h-5 text-gray-600 dark:text-slate-400" />
        </div>
      </div>
    )
  }

  return null
}
