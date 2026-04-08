import { motion } from 'framer-motion'
import { Download, X } from 'lucide-react'
import { useBusinessPanelTheme } from '../../../hooks/useBusinessPanelTheme'

interface ImageModalProps {
  url: string
  name: string
  onClose: () => void
  onDownload: (url: string, name: string) => void
}

export function ImageModal({ url, name, onClose, onDownload }: ImageModalProps) {
  const theme = useBusinessPanelTheme()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ backgroundColor: theme.overlayBg }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="relative flex h-full w-full items-center justify-center"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full border p-3 backdrop-blur-sm transition-colors"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.dividerColor,
            color: theme.textColor,
          }}
          title="Cerrar"
        >
          <X className="h-6 w-6" />
        </button>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onDownload(url, name)
          }}
          className="absolute right-20 top-4 z-10 rounded-full border p-3 backdrop-blur-sm transition-colors"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.dividerColor,
            color: theme.textColor,
          }}
          title="Descargar imagen"
        >
          <Download className="h-6 w-6" />
        </button>

        <img
          src={url}
          alt={name}
          className="h-auto max-h-[90vh] w-auto max-w-[95vw] rounded-lg object-contain shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        />

        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg border px-4 py-2 backdrop-blur-sm"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.dividerColor,
          }}
        >
          <p
            className="max-w-[80vw] truncate whitespace-nowrap text-center text-sm"
            style={{ color: theme.textColor }}
          >
            {name}
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
