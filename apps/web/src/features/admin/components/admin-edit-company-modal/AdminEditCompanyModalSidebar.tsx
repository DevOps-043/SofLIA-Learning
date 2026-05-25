'use client'

import { motion } from 'framer-motion'
import { BuildingOffice2Icon, ChartBarIcon, CheckCircleIcon, EyeIcon, GlobeAltIcon, PauseCircleIcon, SparklesIcon } from '@heroicons/react/24/outline'
import type { AdminCompany } from '../../types/admin-companies.types'
import { colors, type CompanyFormData, type EditTab } from './company-form.constants'

interface AdminEditCompanyModalSidebarProps {
  activeTab: EditTab
  company: AdminCompany
  formData: CompanyFormData
  primaryColor: string
  accentColor: string
  onTabChange: (tab: EditTab) => void
}

export function AdminEditCompanyModalSidebar(props: AdminEditCompanyModalSidebarProps) {
  const navItems = [
    { id: 'general' as const, label: 'General', icon: BuildingOffice2Icon, description: 'Info basica y contacto' },
    { id: 'members' as const, label: 'Miembros', icon: ChartBarIcon, description: 'Estadisticas y admins' },
    { id: 'branding' as const, label: 'Branding', icon: SparklesIcon, description: 'Logo, colores y marca' },
    { id: 'themes' as const, label: 'Temas', icon: EyeIcon, description: 'Estilos predefinidos' },
  ]

  return (
    <div className="hidden w-[320px] shrink-0 flex-col border-r border-white/5 p-8 lg:flex" style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${props.primaryColor} 8.2%, transparent), color-mix(in srgb, ${props.accentColor} 6.3%, transparent))` }}>
      <div className="absolute top-0 right-0 h-64 w-64 -translate-y-1/2 translate-x-1/2 rounded-full bg-white/5 blur-3xl pointer-events-none" />
      <div className="relative z-10 mb-8 text-center"><AdminEditCompanyLogo company={props.company} formData={props.formData} primaryColor={props.primaryColor} accentColor={props.accentColor} /><h3 className="truncate px-2 text-xl font-bold text-white">{props.formData.name || 'Nueva Empresa'}</h3><div className="mt-1 flex items-center justify-center gap-2 opacity-70"><GlobeAltIcon className="h-3 w-3 text-current" style={{ color: props.accentColor }} /><p className="text-xs font-mono text-white/80">{props.formData.slug ? `/${props.formData.slug}` : '/...'}</p></div></div>
      <nav className="relative z-10 flex-1 space-y-2">{navItems.map((item) => <AdminEditCompanyNavItem key={item.id} activeTab={props.activeTab} onClick={() => props.onTabChange(item.id)} {...item} accentColor={props.accentColor} />)}</nav>
      <AdminEditCompanyLicenseCard activeUsers={props.company.active_users} maxUsers={props.formData.max_users} accentColor={props.accentColor} />
    </div>
  )
}

function AdminEditCompanyLogo(props: { company: AdminCompany; formData: CompanyFormData; primaryColor: string; accentColor: string }) {
  return (
    <motion.div className="relative mb-4 inline-block" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
      <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-2 border-white/10 bg-white/5 shadow-2xl backdrop-blur-sm" style={{ background: props.formData.brand_logo_url ? 'var(--color-bg-light)' : `linear-gradient(135deg, ${props.primaryColor}, ${props.accentColor})` }}>
        {props.formData.brand_logo_url ? <img src={props.formData.brand_logo_url} alt="Logo" className="h-full w-full object-contain p-2" /> : <BuildingOffice2Icon className="h-10 w-10 text-white" />}
      </div>
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 rounded-full border border-bgSecondary p-1.5 shadow-lg" style={{ backgroundColor: props.formData.is_active ? colors.success : colors.warning }}>
        {props.formData.is_active ? <CheckCircleIcon className="h-3.5 w-3.5 text-white" /> : <PauseCircleIcon className="h-3.5 w-3.5 text-white" />}
      </motion.div>
    </motion.div>
  )
}

function AdminEditCompanyNavItem(props: { id: EditTab; label: string; description: string; icon: typeof BuildingOffice2Icon; activeTab: EditTab; accentColor: string; onClick: () => void }) {
  const isActive = props.activeTab === props.id
  return (
    <button onClick={props.onClick} className={`group relative w-full overflow-hidden rounded-xl p-3.5 text-left transition-all ${isActive ? 'shadow-lg' : 'hover:bg-white/5'}`}>
      {isActive ? <motion.div layoutId="activeTabBg" className="absolute inset-0 bg-white/10 ring-1 ring-white/10" transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} /> : null}
      <div className="relative z-10 flex items-center gap-3"><props.icon className={`h-5 w-5 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} style={{ color: isActive ? props.accentColor : undefined }} /><div className="min-w-0 flex-1"><p className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>{props.label}</p><p className={`text-[10px] ${isActive ? 'text-white/70' : 'text-gray-500'}`}>{props.description}</p></div></div>
    </button>
  )
}

function AdminEditCompanyLicenseCard(props: { activeUsers: number; maxUsers: number; accentColor: string }) {
  return (
    <div className="relative z-10 mt-6 border-t border-white/5 pt-6"><div className="rounded-xl border border-white/5 bg-white/5 p-3"><div className="mb-2 flex items-end justify-between"><div><p className="text-[10px] uppercase tracking-wider text-gray-400">Licencias</p><p className="mt-1 text-lg font-bold leading-none text-white">{props.activeUsers} <span className="text-xs font-normal text-gray-500">/ {props.maxUsers}</span></p></div><ChartBarIcon className="h-5 w-5 text-white opacity-20" /></div><div className="h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (props.activeUsers / props.maxUsers) * 100)}%`, backgroundColor: props.accentColor }} /></div></div></div>
  )
}
