'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Award,
  Save,
  Plus,
  Trash2,
  Edit2,
  Eye,
  Palette,
  Type,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Upload
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatDate } from '@/utils/date-formatter'
import { Button } from '@aprende-y-aplica/ui'
import Image from 'next/image'
import { ImageUpload } from '../../admin/components/ImageUpload'
import { FeatureLock } from './FeatureLock'

interface CertificateTemplate {
  id?: string
  name: string
  description?: string | null
  design_config: {
    layout?: string
    colors?: {
      primary: string
      secondary: string
      text: string
      background: string
    }
    fonts?: {
      title: string
      body: string
    }
    elements?: {
      show_logo: boolean
      show_signature: boolean
      show_date: boolean
      show_code: boolean
    }
    logo_url?: string
    signature_url?: string
  }
  is_default: boolean
  is_active: boolean
}

export function BusinessCertificateCustomizer() {
  return null
}

function CertificateEditor({
  template,
  onUpdate,
  updateDesignConfig
}: {
  template: CertificateTemplate
  onUpdate: (template: CertificateTemplate) => void
  updateDesignConfig: (path: string[], value: unknown) => void
}) {
  const fontOptions = ['Inter', 'Montserrat', 'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Raleway', 'Georgia', 'Times New Roman']

  return (
    <div className="space-y-6">
      {/* Información Básica */}
      <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700 space-y-4">
        <h3 className="text-lg font-semibold text-white mb-4">Información del Template</h3>
        <div>
          <label className="block text-sm font-medium text-carbon-300 mb-2">
            Nombre del Template
          </label>
          <input
            type="text"
            value={template.name}
            onChange={(e) => onUpdate({ ...template, name: e.target.value })}
            className="w-full px-4 py-2 bg-carbon-800 border border-carbon-700 rounded-lg text-white placeholder-carbon-500 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Nombre del template"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-carbon-300 mb-2">
            Descripción
          </label>
          <textarea
            value={template.description || ''}
            onChange={(e) => onUpdate({ ...template, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 bg-carbon-800 border border-carbon-700 rounded-lg text-white placeholder-carbon-500 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            placeholder="Descripción del template"
          />
        </div>
      </div>

      {/* Colores */}
      <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700 space-y-4">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          Colores
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-carbon-300 mb-2">
              Color Principal
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={template.design_config.colors?.primary || '#8b5cf6'}
                onChange={(e) => updateDesignConfig(['colors', 'primary'], e.target.value)}
                className="w-16 h-10 rounded-lg border border-carbon-700 cursor-pointer"
              />
              <input
                type="text"
                value={template.design_config.colors?.primary || '#8b5cf6'}
                onChange={(e) => updateDesignConfig(['colors', 'primary'], e.target.value)}
                className="flex-1 px-4 py-2 bg-carbon-800 border border-carbon-700 rounded-lg text-white placeholder-carbon-500 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-carbon-300 mb-2">
              Color Secundario
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={template.design_config.colors?.secondary || '#6366f1'}
                onChange={(e) => updateDesignConfig(['colors', 'secondary'], e.target.value)}
                className="w-16 h-10 rounded-lg border border-carbon-700 cursor-pointer"
              />
              <input
                type="text"
                value={template.design_config.colors?.secondary || '#6366f1'}
                onChange={(e) => updateDesignConfig(['colors', 'secondary'], e.target.value)}
                className="flex-1 px-4 py-2 bg-carbon-800 border border-carbon-700 rounded-lg text-white placeholder-carbon-500 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-carbon-300 mb-2">
              Color de Texto
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={template.design_config.colors?.text || '#1f2937'}
                onChange={(e) => updateDesignConfig(['colors', 'text'], e.target.value)}
                className="w-16 h-10 rounded-lg border border-carbon-700 cursor-pointer"
              />
              <input
                type="text"
                value={template.design_config.colors?.text || '#1f2937'}
                onChange={(e) => updateDesignConfig(['colors', 'text'], e.target.value)}
                className="flex-1 px-4 py-2 bg-carbon-800 border border-carbon-700 rounded-lg text-white placeholder-carbon-500 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-carbon-300 mb-2">
              Color de Fondo
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={template.design_config.colors?.background || '#ffffff'}
                onChange={(e) => updateDesignConfig(['colors', 'background'], e.target.value)}
                className="w-16 h-10 rounded-lg border border-carbon-700 cursor-pointer"
              />
              <input
                type="text"
                value={template.design_config.colors?.background || '#ffffff'}
                onChange={(e) => updateDesignConfig(['colors', 'background'], e.target.value)}
                className="flex-1 px-4 py-2 bg-carbon-800 border border-carbon-700 rounded-lg text-white placeholder-carbon-500 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Fuentes */}
      <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700 space-y-4">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Type className="w-5 h-5 text-primary" />
          Tipografía
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-carbon-300 mb-2">
              Fuente del Título
            </label>
            <select
              value={template.design_config.fonts?.title || 'Inter'}
              onChange={(e) => updateDesignConfig(['fonts', 'title'], e.target.value)}
              className="w-full px-4 py-2 bg-carbon-800 border border-carbon-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {fontOptions.map(font => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-carbon-300 mb-2">
              Fuente del Cuerpo
            </label>
            <select
              value={template.design_config.fonts?.body || 'Inter'}
              onChange={(e) => updateDesignConfig(['fonts', 'body'], e.target.value)}
              className="w-full px-4 py-2 bg-carbon-800 border border-carbon-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {fontOptions.map(font => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Elementos */}
      <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700 space-y-4">
        <h3 className="text-lg font-semibold text-white mb-4">Elementos Visibles</h3>
        <div className="space-y-3">
          {[
            { key: 'show_logo', label: 'Mostrar Logo' },
            { key: 'show_signature', label: 'Mostrar Firma' },
            { key: 'show_date', label: 'Mostrar Fecha' },
            { key: 'show_code', label: 'Mostrar Código de Verificación' }
          ].map(element => (
            <label key={element.key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={template.design_config.elements?.[element.key as keyof typeof template.design_config.elements] || false}
                onChange={(e) => updateDesignConfig(['elements', element.key], e.target.checked)}
                className="w-5 h-5 rounded border-carbon-600 bg-carbon-800 text-primary focus:ring-primary focus:ring-2"
              />
              <span className="text-carbon-300">{element.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* URLs de Imágenes */}
      <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700 space-y-4">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-primary" />
          Imágenes
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-carbon-300 mb-2">
              Logo del Certificado
            </label>
            <ImageUpload
              value={template.design_config.logo_url || ''}
              onChange={(url) => updateDesignConfig(['logo_url'], url)}
              bucket="Panel-Business"
              folder="Certificado-logo"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-carbon-300 mb-2">
              Firma del Certificado
            </label>
            <ImageUpload
              value={template.design_config.signature_url || ''}
              onChange={(url) => updateDesignConfig(['signature_url'], url)}
              bucket="Panel-Business"
              folder="Certificado-Firma"
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function CertificatePreview({ template }: { template: CertificateTemplate }) {
  const colors = template.design_config.colors || {
    primary: '#8b5cf6',
    secondary: '#6366f1',
    text: '#1f2937',
    background: '#ffffff'
  }

  const fonts = template.design_config.fonts || {
    title: 'Inter',
    body: 'Inter'
  }

  const elements = template.design_config.elements || {
    show_logo: true,
    show_signature: true,
    show_date: true,
    show_code: true
  }

  const { i18n } = useTranslation()

  return (
    <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700">
      <h3 className="text-lg font-semibold text-white mb-4">Vista Previa del Certificado</h3>
      <div
        className="w-full rounded-lg border-4 shadow-2xl p-8"
        style={{
          backgroundColor: colors.background,
          color: colors.text,
          fontFamily: fonts.body,
          aspectRatio: '8.5 / 11',
          minHeight: '1056px',
          maxWidth: '816px',
          margin: '0 auto'
        }}
      >
        <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
          {/* Logo */}
          {elements.show_logo && template.design_config.logo_url && (
            <div className="w-32 h-32 relative mb-4">
              <Image
                src={template.design_config.logo_url}
                alt="Logo"
                fill
                className="object-contain"
              />
            </div>
          )}

          {/* Título */}
          <div style={{ fontFamily: fonts.title }}>
            <h1
              className="text-4xl font-bold mb-2"
              style={{ color: colors.primary }}
            >
              Certificado de Completación
            </h1>
            <p className="text-xl" style={{ color: colors.text }}>
              Se certifica que
            </p>
          </div>

          {/* Nombre del Estudiante */}
          <div className="my-4">
            <h2
              className="text-5xl font-bold"
              style={{ color: colors.primary }}
            >
              Juan Pérez
            </h2>
          </div>

          {/* Descripción */}
          <div style={{ fontFamily: fonts.body }}>
            <p className="text-lg" style={{ color: colors.text }}>
              ha completado exitosamente el curso
            </p>
            <p
              className="text-2xl font-semibold mt-2"
              style={{ color: colors.secondary }}
            >
              Introducción a React
            </p>
          </div>

          {/* Fecha y Código */}
          <div className="mt-8 flex items-center justify-between w-full">
            {elements.show_date && (
              <div>
                <p className="text-sm" style={{ color: colors.text }}>
                  Fecha: {formatDate(new Date(), i18n.language)}
                </p>
              </div>
            )}
            {elements.show_code && (
              <div>
                <p className="text-xs font-mono" style={{ color: colors.secondary }}>
                  Código: ABC123XYZ
                </p>
              </div>
            )}
          </div>

          {/* Firma */}
          {elements.show_signature && template.design_config.signature_url && (
            <div className="mt-8">
              <div className="w-32 h-16 relative mx-auto">
                <Image
                  src={template.design_config.signature_url}
                  alt="Firma"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

