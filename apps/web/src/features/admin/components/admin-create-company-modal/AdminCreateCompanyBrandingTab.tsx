'use client'

import type { ChangeEvent, MutableRefObject } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowPathIcon,
  CloudArrowUpIcon,
  GlobeAltIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline'
import { updateCompanyColor } from './service'
import type { CreateCompanyData } from './types'

interface AdminCreateCompanyBrandingTabProps {
  formData: CreateCompanyData
  uploadingLogo: boolean
  uploadingBanner: boolean
  logoInputRef: MutableRefObject<HTMLInputElement | null>
  bannerInputRef: MutableRefObject<HTMLInputElement | null>
  onFormDataChange: (updater: (current: CreateCompanyData) => CreateCompanyData) => void
  onFileChange: (
    e: ChangeEvent<HTMLInputElement>,
    imageType: 'logo' | 'banner',
  ) => void
}

const colorFields = [
  { key: 'brand_color_primary', label: 'Primario' },
  { key: 'brand_color_secondary', label: 'Secundario' },
  { key: 'brand_color_accent', label: 'Acento' },
] as const

export function AdminCreateCompanyBrandingTab({
  formData,
  uploadingLogo,
  uploadingBanner,
  logoInputRef,
  bannerInputRef,
  onFormDataChange,
  onFileChange,
}: AdminCreateCompanyBrandingTabProps) {
  return (
    <motion.div
      key="branding"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8 max-w-3xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <label className="text-xs text-gray-600 dark:text-gray-400 mb-3 block uppercase tracking-wider font-bold ml-1">
            Logo de la Empresa
          </label>
          <input
            type="file"
            ref={logoInputRef}
            onChange={(e) => onFileChange(e, 'logo')}
            accept="image/*"
            className="hidden"
          />
          <div
            onClick={() => !uploadingLogo && logoInputRef.current?.click()}
            className={`aspect-square rounded-2xl bg-gray-50 dark:bg-black/20 border-2 border-dashed flex flex-col items-center justify-center p-4 mb-4 group transition-all relative overflow-hidden cursor-pointer ${
              uploadingLogo
                ? 'border-accent/50 bg-accent/5'
                : 'border-gray-300 dark:border-white/20 hover:border-accent/50 hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
          >
            {uploadingLogo ? (
              <div className="flex flex-col items-center gap-3">
                <ArrowPathIcon className="w-8 h-8 text-accent animate-spin" />
                <p className="text-xs text-accent font-medium">Subiendo...</p>
              </div>
            ) : formData.brand_logo_url ? (
              <>
                <img
                  src={formData.brand_logo_url}
                  className="w-full h-full object-contain relative z-10"
                  alt="Logo"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity z-20 backdrop-blur-sm gap-2">
                  <CloudArrowUpIcon className="w-8 h-8 text-white" />
                  <p className="text-xs text-white font-medium">Cambiar logo</p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 group-hover:scale-105 transition-transform">
                <div className="p-4 rounded-2xl bg-gray-100 dark:bg-white/5 group-hover:bg-accent/10 transition-colors">
                  <PhotoIcon className="w-10 h-10 text-gray-500 group-hover:text-accent transition-colors" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                    Subir logo
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-600">
                    PNG, JPG, SVG (máx. 5MB)
                  </p>
                </div>
              </div>
            )}
          </div>
          {formData.brand_logo_url && (
            <button
              type="button"
              onClick={() =>
                onFormDataChange((current) => ({
                  ...current,
                  brand_logo_url: '',
                }))
              }
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Eliminar logo
            </button>
          )}
        </div>

        <div>
          <label className="text-xs text-gray-600 dark:text-gray-400 mb-3 block uppercase tracking-wider font-bold ml-1">
            Banner de Marca
          </label>
          <input
            type="file"
            ref={bannerInputRef}
            onChange={(e) => onFileChange(e, 'banner')}
            accept="image/*"
            className="hidden"
          />
          <div
            onClick={() => !uploadingBanner && bannerInputRef.current?.click()}
            className={`aspect-square rounded-2xl bg-gray-50 dark:bg-black/20 border-2 border-dashed flex flex-col items-center justify-center p-4 mb-4 group transition-all relative overflow-hidden cursor-pointer ${
              uploadingBanner
                ? 'border-accent/50 bg-accent/5'
                : 'border-gray-300 dark:border-white/20 hover:border-accent/50 hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
          >
            {uploadingBanner ? (
              <div className="flex flex-col items-center gap-3">
                <ArrowPathIcon className="w-8 h-8 text-accent animate-spin" />
                <p className="text-xs text-accent font-medium">Subiendo...</p>
              </div>
            ) : formData.brand_banner_url ? (
              <>
                <img
                  src={formData.brand_banner_url}
                  className="w-full h-full object-cover relative z-10"
                  alt="Banner"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity z-20 backdrop-blur-sm gap-2">
                  <CloudArrowUpIcon className="w-8 h-8 text-white" />
                  <p className="text-xs text-white font-medium">Cambiar banner</p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 group-hover:scale-105 transition-transform">
                <div className="p-4 rounded-2xl bg-gray-100 dark:bg-white/5 group-hover:bg-accent/10 transition-colors">
                  <GlobeAltIcon className="w-10 h-10 text-gray-500 group-hover:text-accent transition-colors" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                    Subir banner
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-600">
                    PNG, JPG (máx. 10MB)
                  </p>
                </div>
              </div>
            )}
          </div>
          {formData.brand_banner_url && (
            <button
              type="button"
              onClick={() =>
                onFormDataChange((current) => ({
                  ...current,
                  brand_banner_url: '',
                }))
              }
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Eliminar banner
            </button>
          )}
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-600 dark:text-gray-400 mb-4 block uppercase tracking-wider font-bold border-b border-gray-200 dark:border-white/5 pb-2">
          Paleta de Colores Personalizada
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {colorFields.map((colorField) => (
            <div
              key={colorField.key}
              className="p-3 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            >
              <p className="text-[10px] text-gray-400 mb-2 uppercase font-medium">
                {colorField.label}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-300 dark:border-white/20 shrink-0 relative shadow-lg">
                  <input
                    type="color"
                    value={formData[colorField.key]}
                    onChange={(e) =>
                      onFormDataChange((current) =>
                        updateCompanyColor(current, colorField.key, e.target.value),
                      )
                    }
                    className="absolute inset-0 w-full h-full p-0 border-none cursor-pointer scale-150"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={formData[colorField.key]}
                    onChange={(e) =>
                      onFormDataChange((current) =>
                        updateCompanyColor(current, colorField.key, e.target.value),
                      )
                    }
                    className="w-full bg-transparent text-sm font-mono text-gray-900 dark:text-white outline-none border-b border-transparent focus:border-gray-300 dark:focus:border-white/30"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
