import { motion } from 'framer-motion'
import { Image as ImageIcon, Sparkles, Upload } from 'lucide-react'
import type { OrganizationFormState, OrganizationTabStyles, OrganizationTabTheme } from './types'

export function OrganizationMediaSection({ formState, styles, theme }: {
  formState: OrganizationFormState
  styles: OrganizationTabStyles
  theme: OrganizationTabTheme
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="rounded-2xl p-6 border" style={styles.cardStyle}>
        <MediaHeader description="Imagen de fondo del panel" icon={<ImageIcon className="w-5 h-5" />} title="Banner de la Empresa" theme={theme} styles={styles} />
        <motion.button type="button" onClick={formState.uploadBanner} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="w-full relative h-32 rounded-xl overflow-hidden mb-4 border-2 border-dashed flex items-center justify-center" style={{ borderColor: theme.actionColor + '33', backgroundColor: theme.inputBg }}>
          {formState.formData.banner_url ? <img src={formState.formData.banner_url} alt="Vista previa del banner" className="w-full h-full object-cover" /> : <UploadPrompt text="Haz clic para subir banner" theme={theme} styles={styles} />}
        </motion.button>
      </div>
      <div className="rounded-2xl p-6 border" style={styles.cardStyle}>
        <MediaHeader description="Logo principal en formato cuadrado" icon={<Sparkles className="w-5 h-5" />} title="Ícono de la Empresa" theme={theme} styles={styles} variant="secondary" />
        <div className="flex items-center gap-6">
          <motion.button type="button" onClick={formState.uploadLogo} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-dashed flex items-center justify-center" style={{ borderColor: theme.secondaryColor + '33', backgroundColor: theme.inputBg }}>
            {formState.formData.icon_url ? <img src={formState.formData.icon_url} alt="Vista previa del ícono" className="w-full h-full object-contain p-2" /> : <Upload className="w-6 h-6" style={styles.mutedStyle} />}
          </motion.button>
          <div className="flex-1"><p className="text-sm font-medium mb-2" style={styles.helpStyle}>Recomendado: 512x512 px. Formato PNG o SVG para mejores resultados.</p><button type="button" onClick={formState.uploadLogo} className="text-xs font-bold uppercase tracking-wider transition-colors" style={{ color: theme.actionColor }}>Cambiar imagen</button></div>
        </div>
      </div>
    </motion.div>
  )
}

function MediaHeader({ description, icon, title, theme, styles, variant = 'primary' }: { description: string; icon: React.ReactNode; title: string; theme: OrganizationTabTheme; styles: OrganizationTabStyles; variant?: 'primary' | 'secondary' }) {
  const color = variant === 'secondary' ? theme.secondaryColor : theme.actionColor
  return <div className="flex items-center gap-3 mb-4"><div className="p-2.5 rounded-xl" style={{ backgroundColor: variant === 'secondary' ? theme.secondaryColor + '18' : theme.actionSurface, color }}>{icon}</div><div><h3 className="text-lg font-bold" style={styles.labelStyle}>{title}</h3><p className="text-xs" style={styles.helpStyle}>{description}</p></div></div>
}

function UploadPrompt({ text, theme, styles }: { text: string; theme: OrganizationTabTheme; styles: OrganizationTabStyles }) {
  return <div className="text-center"><Upload className="w-8 h-8 mx-auto mb-2" style={styles.mutedStyle} /><p className="text-xs font-medium" style={{ color: theme.subtextColor }}>{text}</p></div>
}
