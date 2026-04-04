'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import { ArrowPathIcon, CloudArrowUpIcon, PhotoIcon, GlobeAltIcon } from '@heroicons/react/24/outline'
import { CompanyFormData, BrandingColorKey, BRANDING_COLOR_FIELDS } from './company-form.constants'

interface CompanyBrandingTabProps {
  formData: CompanyFormData
  uploadingLogo: boolean
  uploadingBanner: boolean
  logoInputRef: React.RefObject<HTMLInputElement>
  bannerInputRef: React.RefObject<HTMLInputElement>
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>, imageType: 'logo' | 'banner') => void
  onUpdateColor: (key: BrandingColorKey, value: string) => void
  setFormData: React.Dispatch<React.SetStateAction<CompanyFormData>>
}

export function CompanyBrandingTab({
  formData,
  uploadingLogo,
  uploadingBanner,
  logoInputRef,
  bannerInputRef,
  onFileChange,
  onUpdateColor,
  setFormData,
}: CompanyBrandingTabProps) {
  return (
    <motion.div
      key="branding"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8 max-w-3xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Logo */}
        <div>
          <label className="text-xs text-gray-400 mb-3 block uppercase tracking-wider font-bold ml-1">Logo de la Empresa</label>
          <input type="file" ref={logoInputRef} onChange={e => onFileChange(e, 'logo')} accept="image/*" className="hidden" />
          <div
            onClick={() => !uploadingLogo && logoInputRef.current?.click()}
            className={`aspect-square rounded-2xl bg-black/20 border-2 border-dashed flex flex-col items-center justify-center p-4 mb-4 group transition-all relative overflow-hidden cursor-pointer ${uploadingLogo ? 'border-accent/50 bg-accent/5' : 'border-white/20 hover:border-accent/50 hover:bg-white/5'}`}
          >
            {uploadingLogo ? (
              <div className="flex flex-col items-center gap-3">
                <ArrowPathIcon className="w-8 h-8 text-accent animate-spin" />
                <p className="text-xs text-accent font-medium">Subiendo...</p>
              </div>
            ) : formData.brand_logo_url ? (
              <>
                <img src={formData.brand_logo_url} className="w-full h-full object-contain relative z-10" alt="Logo" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity z-20 backdrop-blur-sm gap-2">
                  <CloudArrowUpIcon className="w-8 h-8 text-white" />
                  <p className="text-xs text-white font-medium">Cambiar logo</p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 group-hover:scale-105 transition-transform">
                <div className="p-4 rounded-2xl bg-white/5 group-hover:bg-accent/10 transition-colors">
                  <PhotoIcon className="w-10 h-10 text-gray-500 group-hover:text-accent transition-colors" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400 group-hover:text-white transition-colors">Subir logo</p>
                  <p className="text-[10px] text-gray-600">PNG, JPG, SVG (máx. 5MB)</p>
                </div>
              </div>
            )}
          </div>
          {formData.brand_logo_url && (
            <button type="button" onClick={() => setFormData(prev => ({ ...prev, brand_logo_url: '' }))} className="text-xs text-red-400 hover:text-red-300 transition-colors">
              Eliminar logo
            </button>
          )}
        </div>

        {/* Banner */}
        <div>
          <label className="text-xs text-gray-400 mb-3 block uppercase tracking-wider font-bold ml-1">Banner de Marca</label>
          <input type="file" ref={bannerInputRef} onChange={e => onFileChange(e, 'banner')} accept="image/*" className="hidden" />
          <div
            onClick={() => !uploadingBanner && bannerInputRef.current?.click()}
            className={`aspect-square rounded-2xl bg-black/20 border-2 border-dashed flex flex-col items-center justify-center p-4 mb-4 group transition-all relative overflow-hidden cursor-pointer ${uploadingBanner ? 'border-accent/50 bg-accent/5' : 'border-white/20 hover:border-accent/50 hover:bg-white/5'}`}
          >
            {uploadingBanner ? (
              <div className="flex flex-col items-center gap-3">
                <ArrowPathIcon className="w-8 h-8 text-accent animate-spin" />
                <p className="text-xs text-accent font-medium">Subiendo...</p>
              </div>
            ) : formData.brand_banner_url ? (
              <>
                <img src={formData.brand_banner_url} className="w-full h-full object-cover relative z-10" alt="Banner" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity z-20 backdrop-blur-sm gap-2">
                  <CloudArrowUpIcon className="w-8 h-8 text-white" />
                  <p className="text-xs text-white font-medium">Cambiar banner</p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 group-hover:scale-105 transition-transform">
                <div className="p-4 rounded-2xl bg-white/5 group-hover:bg-accent/10 transition-colors">
                  <GlobeAltIcon className="w-10 h-10 text-gray-500 group-hover:text-accent transition-colors" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400 group-hover:text-white transition-colors">Subir banner</p>
                  <p className="text-[10px] text-gray-600">PNG, JPG (máx. 10MB)</p>
                </div>
              </div>
            )}
          </div>
          {formData.brand_banner_url && (
            <button type="button" onClick={() => setFormData(prev => ({ ...prev, brand_banner_url: '' }))} className="text-xs text-red-400 hover:text-red-300 transition-colors">
              Eliminar banner
            </button>
          )}
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-400 mb-4 block uppercase tracking-wider font-bold border-b border-white/5 pb-2">
          Paleta de Colores Personalizada
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {BRANDING_COLOR_FIELDS.map(c => (
            <div key={c.k} className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <p className="text-[10px] text-gray-400 mb-2 uppercase font-medium">{c.l}</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/20 shrink-0 relative shadow-lg">
                  <input type="color" value={formData[c.k]} onChange={e => onUpdateColor(c.k, e.target.value)} className="absolute inset-0 w-full h-full p-0 border-none cursor-pointer scale-150" />
                </div>
                <div className="flex-1 min-w-0">
                  <input type="text" value={formData[c.k]} onChange={e => onUpdateColor(c.k, e.target.value)} className="w-full bg-transparent text-sm font-mono text-white outline-none border-b border-transparent focus:border-white/30" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
