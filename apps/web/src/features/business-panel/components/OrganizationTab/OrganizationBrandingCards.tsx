import { motion } from 'framer-motion'
import { Image as ImageIcon, Sparkles, Upload } from 'lucide-react'
import type { OrganizationSectionProps } from './types'

export function OrganizationBrandingCards({ form, theme }: OrganizationSectionProps) {
  const cardStyle = { backgroundColor: theme.cardBg, borderColor: theme.borderColor }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-8"
    >
      <div className="rounded-2xl p-6 border" style={cardStyle}>
        <BrandingHeader
          icon={ImageIcon}
          title="Banner de la Empresa"
          description="Imagen de fondo del panel"
          theme={theme}
        />
        <motion.button
          type="button"
          onClick={form.uploadBanner}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full relative h-32 rounded-xl overflow-hidden mb-4 border-2 border-dashed flex items-center justify-center"
          style={{ borderColor: `color-mix(in srgb, ${theme.actionColor} 20%, transparent)`, backgroundColor: theme.inputBg }}
        >
          {form.formData.banner_url ? (
            <img src={form.formData.banner_url} alt="Vista previa del banner" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center">
              <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: theme.mutedTextColor }} />
              <p className="text-xs font-medium" style={{ color: theme.subtextColor }}>Haz clic para subir banner</p>
            </div>
          )}
        </motion.button>
      </div>

      <div className="rounded-2xl p-6 border" style={cardStyle}>
        <BrandingHeader
          icon={Sparkles}
          title="Icono de la Empresa"
          description="Logo principal en formato cuadrado"
          theme={theme}
        />
        <div className="flex items-center gap-6">
          <motion.button
            type="button"
            onClick={form.uploadLogo}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-dashed flex items-center justify-center"
            style={{ borderColor: `color-mix(in srgb, ${theme.secondaryColor} 20%, transparent)`, backgroundColor: theme.inputBg }}
          >
            {form.formData.icon_url ? <img src={form.formData.icon_url} alt="Vista previa del icono" className="w-full h-full object-contain p-2" /> : <Upload className="w-6 h-6" style={{ color: theme.mutedTextColor }} />}
          </motion.button>
          <div className="flex-1">
            <p className="text-sm font-medium mb-2" style={{ color: theme.subtextColor }}>
              Recomendado: 512x512 px. Formato PNG o SVG para mejores resultados.
            </p>
            <button type="button" onClick={form.uploadLogo} className="text-xs font-bold uppercase tracking-wider transition-colors" style={{ color: theme.actionColor }}>
              Cambiar imagen
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function BrandingHeader({ icon: Icon, title, description, theme }: { icon: typeof ImageIcon; title: string; description: string; theme: OrganizationSectionProps['theme'] }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2.5 rounded-xl" style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h3 className="text-lg font-bold" style={{ color: theme.textColor }}>{title}</h3>
        <p className="text-xs" style={{ color: theme.subtextColor }}>{description}</p>
      </div>
    </div>
  )
}
