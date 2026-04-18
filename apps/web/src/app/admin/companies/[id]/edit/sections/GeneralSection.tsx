'use client'

import React from 'react'
import { BuildingOffice2Icon, Cog6ToothIcon, EnvelopeIcon, PhoneIcon, GlobeAltIcon, PhotoIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'
import type { CompanyData } from '@/features/admin/hooks/useEditCompanyLogic'
import { colors, SectionWrapper, Card, InputField } from './shared'

function GeneralSection({ company, setCompany }: { company: CompanyData; setCompany: (c: CompanyData) => void }) {
    return (
        <SectionWrapper>
            {/* Información Básica */}
            <Card title="Información Básica" description="Datos principales de la empresa" icon={BuildingOffice2Icon}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                        label="Nombre de la empresa"
                        value={company.name}
                        onChange={(v) => setCompany({ ...company, name: v })}
                    />
                    <InputField
                        label="Slug (URL)"
                        value={company.slug || ''}
                        onChange={(v) => setCompany({ ...company, slug: v.toLowerCase().replace(/\s+/g, '-') })}
                        placeholder="mi-empresa"
                    />
                </div>
                <div className="mt-4">
                    <label className="block text-xs font-medium text-gray-600 dark:text-white/70 mb-1.5">Descripción</label>
                    <textarea
                        value={company.description || ''}
                        onChange={(e) => setCompany({ ...company, description: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-gray-50 dark:bg-[#0F1419] border-gray-200 dark:border-white/10 focus:outline-none focus:border-[#0A2540] dark:focus:border-[#00D4B3] transition-colors resize-none"
                        placeholder="Descripción de la empresa..."
                    />
                </div>
            </Card>

            {/* Información de Contacto */}
            <Card title="Información de Contacto" description="Datos de contacto de la empresa" icon={EnvelopeIcon} iconColor={colors.blue}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                        label="Email de contacto"
                        value={company.contact_email || ''}
                        onChange={(v) => setCompany({ ...company, contact_email: v })}
                        type="email"
                        placeholder="contacto@empresa.com"
                        icon={EnvelopeIcon}
                    />
                    <InputField
                        label="Teléfono"
                        value={company.contact_phone || ''}
                        onChange={(v) => setCompany({ ...company, contact_phone: v })}
                        type="tel"
                        placeholder="+52 55 1234 5678"
                        icon={PhoneIcon}
                    />
                </div>
                <div className="mt-4">
                    <InputField
                        label="Sitio web"
                        value={company.website_url || ''}
                        onChange={(v) => setCompany({ ...company, website_url: v })}
                        type="url"
                        placeholder="https://www.empresa.com"
                        icon={GlobeAltIcon}
                    />
                </div>
            </Card>

            {/* Branding */}
            <Card title="Branding" description="Logos y recursos visuales" icon={PhotoIcon} iconColor={colors.purple}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InputField
                        label="URL del Logo"
                        value={company.brand_logo_url || company.logo_url || ''}
                        onChange={(v) => setCompany({ ...company, brand_logo_url: v })}
                        placeholder="https://..."
                    />
                    <InputField
                        label="URL del Banner"
                        value={company.brand_banner_url || ''}
                        onChange={(v) => setCompany({ ...company, brand_banner_url: v })}
                        placeholder="https://..."
                    />
                    <InputField
                        label="URL del Favicon"
                        value={company.brand_favicon_url || ''}
                        onChange={(v) => setCompany({ ...company, brand_favicon_url: v })}
                        placeholder="https://..."
                    />
                </div>

                {/* Preview */}
                {(company.brand_banner_url || company.brand_logo_url || company.logo_url) && (
                    <div className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-[#0F1419]">
                        <p className="text-xs font-medium text-gray-500 dark:text-white/50 mb-3 uppercase">Vista previa</p>
                        <div
                            className="h-24 rounded-lg relative overflow-hidden bg-gray-200 dark:bg-white/10"
                            style={{
                                backgroundImage: company.brand_banner_url ? `url(${company.brand_banner_url})` : undefined,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            }}
                        >
                            <div className="absolute -bottom-5 left-4">
                                <div
                                    className="h-14 w-14 rounded-xl overflow-hidden border-3 flex items-center justify-center bg-white dark:bg-[#1E2329] border-white dark:border-[#1E2329]"
                                    style={{ borderWidth: '3px' }}
                                >
                                    {(company.brand_logo_url || company.logo_url) ? (
                                        <img src={company.brand_logo_url || company.logo_url || ''} alt="Logo" className="h-full w-full object-contain" />
                                    ) : (
                                        <BuildingOffice2Icon className="h-7 w-7 text-gray-400 dark:text-[#8899A6]" />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Card>

            {/* Estado y Límites */}
            <Card title="Estado y Límites" description="Configuración de estado de la empresa" icon={Cog6ToothIcon} iconColor={colors.warning}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-white/70 mb-1.5">Máximo de usuarios</label>
                        <input
                            type="number"
                            min="1"
                            value={company.max_users || ''}
                            onChange={(e) => setCompany({ ...company, max_users: parseInt(e.target.value) || null })}
                            className="w-full px-4 py-2.5 rounded-xl border text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-[#0F1419] border-gray-200 dark:border-white/10 focus:outline-none focus:border-[#0A2540] dark:focus:border-[#00D4B3]"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-white/70 mb-1.5">Estado de la empresa</label>
                        <div className="flex items-center gap-3 h-[42px]">
                            <button
                                onClick={() => setCompany({ ...company, is_active: !company.is_active })}
                                className="relative w-12 h-6 rounded-full transition-colors"
                                style={{ backgroundColor: company.is_active ? colors.success : 'rgba(136, 153, 166, 0.4)' }}
                            >
                                <motion.div
                                    className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                                    animate={{ left: company.is_active ? '1.75rem' : '0.25rem' }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                />
                            </button>
                            <span className="text-sm text-gray-900 dark:text-white">
                                {company.is_active ? 'Empresa activa' : 'Empresa pausada'}
                            </span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Seguridad y Acceso (SSO) */}
            <Card title="Seguridad y Acceso" description="Configuración de inicio de sesión mediante SSO" icon={ShieldCheckIcon || Cog6ToothIcon} iconColor={colors.accent}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Google SSO */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[#0F1419] border border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10">
                                <svg className="h-5 w-5" viewBox="0 0 24 24">
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">Google SSO</p>
                                <p className="text-xs text-gray-500 dark:text-[#8899A6]">Permitir acceso con Google</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setCompany({ ...company, google_login_enabled: !company.google_login_enabled })}
                            className="relative w-12 h-6 rounded-full transition-colors"
                            style={{ backgroundColor: company.google_login_enabled ? colors.success : 'rgba(136, 153, 166, 0.4)' }}
                        >
                            <motion.div
                                className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                                animate={{ left: company.google_login_enabled ? '1.75rem' : '0.25rem' }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                        </button>
                    </div>

                    {/* Microsoft SSO */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[#0F1419] border border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10">
                                <svg className="h-5 w-5" viewBox="0 0 23 23">
                                    <path fill="#f3f3f3" d="M0 0h23v23H0z" />
                                    <path fill="#f35325" d="M1 1h10v10H1z" />
                                    <path fill="#81bc06" d="M12 1h10v10H12z" />
                                    <path fill="#05a6f0" d="M1 12h10v10H1z" />
                                    <path fill="#ffba08" d="M12 12h10v10H12z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">Microsoft SSO</p>
                                <p className="text-xs text-gray-500 dark:text-[#8899A6]">Permitir acceso con Microsoft</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setCompany({ ...company, microsoft_login_enabled: !company.microsoft_login_enabled })}
                            className="relative w-12 h-6 rounded-full transition-colors"
                            style={{ backgroundColor: company.microsoft_login_enabled ? colors.success : 'rgba(136, 153, 166, 0.4)' }}
                        >
                            <motion.div
                                className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                                animate={{ left: company.microsoft_login_enabled ? '1.75rem' : '0.25rem' }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                        </button>
                    </div>
                </div>
            </Card>
        </SectionWrapper>
    )
}

// ============================================
// USERS SECTION
// ============================================

export { GeneralSection }
