'use client'

import React from 'react'
import { PaintBrushIcon, SwatchIcon } from '@heroicons/react/24/outline'
import type { CompanyData } from '@/features/admin/hooks/useEditCompanyLogic'
import { colors, SectionWrapper, Card } from './shared'

function CustomizationSection({ company, setCompany }: { company: CompanyData; setCompany: (c: CompanyData) => void }) {
    // Valores por defecto
    const primaryColor = company.brand_color_primary || '#3b82f6'
    const secondaryColor = company.brand_color_secondary || '#10b981'
    const accentColor = company.brand_color_accent || '#8b5cf6'
    const fontFamily = company.brand_font_family || 'Inter'

    const validFonts = ['Inter', 'Montserrat', 'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Raleway', 'Source Sans Pro']

    return (
        <SectionWrapper>
            <Card
                title="Paleta de Colores"
                description="Personaliza los colores de la marca"
                icon={SwatchIcon}
                iconColor={colors.pink}
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-xs font-medium text-white/70 mb-2">Color Primario</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={primaryColor}
                                onChange={(e) => setCompany({ ...company, brand_color_primary: e.target.value })}
                                className="h-10 w-14 rounded-lg cursor-pointer border-0"
                                style={{ backgroundColor: 'transparent' }}
                            />
                            <input
                                type="text"
                                value={primaryColor}
                                onChange={(e) => setCompany({ ...company, brand_color_primary: e.target.value })}
                                className="flex-1 px-3 py-2 rounded-lg border text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-[#0F1419] border-gray-200 dark:border-white/10 focus:outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-white/70 mb-2">Color Secundario</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={secondaryColor}
                                onChange={(e) => setCompany({ ...company, brand_color_secondary: e.target.value })}
                                className="h-10 w-14 rounded-lg cursor-pointer border-0"
                                style={{ backgroundColor: 'transparent' }}
                            />
                            <input
                                type="text"
                                value={secondaryColor}
                                onChange={(e) => setCompany({ ...company, brand_color_secondary: e.target.value })}
                                className="flex-1 px-3 py-2 rounded-lg border text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-[#0F1419] border-gray-200 dark:border-white/10 focus:outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-white/70 mb-2">Color de Acento</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={accentColor}
                                onChange={(e) => setCompany({ ...company, brand_color_accent: e.target.value })}
                                className="h-10 w-14 rounded-lg cursor-pointer border-0"
                                style={{ backgroundColor: 'transparent' }}
                            />
                            <input
                                type="text"
                                value={accentColor}
                                onChange={(e) => setCompany({ ...company, brand_color_accent: e.target.value })}
                                className="flex-1 px-3 py-2 rounded-lg border text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-[#0F1419] border-gray-200 dark:border-white/10 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Preview */}
                <div className="mt-6 p-4 rounded-xl bg-gray-50 dark:bg-[#0F1419]">
                    <p className="text-xs font-medium text-gray-500 dark:text-white/50 mb-3 uppercase">Vista previa</p>
                    <div className="flex gap-3">
                        <div className="h-10 flex-1 rounded-lg" style={{ backgroundColor: primaryColor }} />
                        <div className="h-10 flex-1 rounded-lg" style={{ backgroundColor: secondaryColor }} />
                        <div className="h-10 flex-1 rounded-lg" style={{ backgroundColor: accentColor }} />
                    </div>
                </div>
            </Card>

            <Card
                title="Tipografía"
                description="Selecciona la fuente de la marca"
                icon={PaintBrushIcon}
                iconColor={colors.purple}
            >
                <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-white/70 mb-2">Fuente principal</label>
                    <select
                        value={fontFamily}
                        onChange={(e) => setCompany({ ...company, brand_font_family: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-[#0F1419] border-gray-200 dark:border-white/10 focus:outline-none focus:border-[#00D4B3]"
                    >
                        {validFonts.map((font) => (
                            <option key={font} value={font}>{font}</option>
                        ))}
                    </select>
                </div>

                {/* Font Preview */}
                <div className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-[#0F1419]">
                    <p className="text-xs font-medium text-gray-500 dark:text-white/50 mb-3 uppercase">Vista previa</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily }}>
                        Vista previa de texto
                    </p>
                    <p className="text-base text-gray-600 dark:text-white/70 mt-1" style={{ fontFamily }}>
                        Así se verá el texto con la fuente seleccionada
                    </p>
                </div>
            </Card>

            <Card
                title="Estilos del Panel"
                description="Personaliza el aspecto del panel de administración"
                icon={PaintBrushIcon}
                iconColor={colors.grayMedium}
            >
                <div className="text-center py-8">
                    <PaintBrushIcon className="h-16 w-16 mx-auto mb-4" style={{ color: colors.grayMedium }} />
                    <p className="text-lg font-medium text-white mb-2">Próximamente</p>
                    <p className="text-sm" style={{ color: colors.grayMedium }}>
                        Configuración avanzada de estilos (panel_styles, login_styles, user_dashboard_styles)
                    </p>
                </div>
            </Card>
        </SectionWrapper>
    )
}

// ============================================
// NOTIFICATIONS SECTION
// ============================================

export { CustomizationSection }
