'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSubscriptionFeatures } from './useSubscriptionFeatures'
import { getPlanById, calculatePlanPrice, type BusinessPlanId, type BillingCycle } from '../services/subscription.utils'

interface PlanFeature {
  name: string
  description: string
  team: boolean
  business: boolean
  enterprise: boolean
}

interface Plan {
  id: string
  name: string
  tagline: string
  price: string
  priceYearly: number
  priceMonthly: number
  yearlyPrice: string
  monthlyPrice: string
  features: string[]
  isPopular?: boolean
  badge?: string
}

export function useBusinessSubscriptionPlansLogic() {
  const { plan: currentPlan, billingCycle: currentBillingCycle, subscription, loading: planLoading, changePlan, refetch } = useSubscriptionFeatures()
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(() => currentBillingCycle || 'yearly')
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isChangingPlan, setIsChangingPlan] = useState(false)
  const [changeError, setChangeError] = useState<string | null>(null)
  const [changeSuccess, setChangeSuccess] = useState(false)

  useEffect(() => {
    if (currentBillingCycle && currentBillingCycle !== billingCycle) {
      setBillingCycle(currentBillingCycle)
    }
  }, [currentBillingCycle, billingCycle])

  const plans: Plan[] = [
    {
      id: 'team',
      name: 'Team',
      tagline: 'Perfecto para equipos pequeños',
      priceYearly: 4999,
      priceMonthly: 499,
      yearlyPrice: '$4,999 /año',
      monthlyPrice: '$499/mes',
      price: billingCycle === 'yearly' ? '$4,999 /año' : '$499/mes',
      features: [
        'Hasta 10 usuarios',
        'Acceso a todos los cursos',
        '50 certificados/mes',
        'Reportes básicos',
        'Plantillas de reportes',
        'Notificaciones automáticas',
        'Soporte por email'
      ]
    },
    {
      id: 'business',
      name: 'Business',
      tagline: 'Ideal para empresas en crecimiento',
      priceYearly: 14999,
      priceMonthly: 1499,
      yearlyPrice: '$14,999 /año',
      monthlyPrice: '$1,499/mes',
      price: billingCycle === 'yearly' ? '$14,999 /año' : '$1,499/mes',
      features: [
        'Hasta 50 usuarios',
        'Acceso a todos los cursos',
        'Certificaciones ilimitadas',
        'Analytics avanzados',
        'Panel de administración',
        'AI Coach para equipos',
        'White-label parcial',
        'Recordatorios automáticos',
        'Benchmarking',
        'Soporte prioritario',
        'Contenido personalizado'
      ],
      isPopular: true,
      badge: '20% OFF'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      tagline: 'Soluciones a medida para grandes organizaciones',
      priceYearly: 0,
      priceMonthly: 0,
      yearlyPrice: 'Personalizado',
      monthlyPrice: 'Personalizado',
      price: 'Personalizado',
      features: [
        'Usuarios ilimitados',
        'Acceso a todos los cursos',
        'Certificaciones ilimitadas',
        'Analytics empresariales',
        'Panel administración avanzado',
        'White-label completo',
        'AI Coach avanzado',
        'Multi-tenancy avanzado',
        'Advanced compliance',
        'Métricas personalizadas',
        'Onboarding automatizado',
        'Comunidades privadas',
        'Learning paths avanzados',
        'Soporte 24/7 dedicado',
        'Contenido 100% personalizado',
        'API de datos completa',
        'Consultoría estratégica',
        'Branding corporativo'
      ]
    }
  ]

  const featuresByCategory: Record<string, PlanFeature[]> = {
    'Administración y Gestión': [
      { name: 'Panel de administración', description: 'Gestiona usuarios y asignaciones de cursos', team: true, business: true, enterprise: true },
      { name: 'Asignación de cursos con mensajería', description: 'Personaliza mensajes al asignar cursos', team: false, business: true, enterprise: true },
      { name: 'Grupos de usuarios personalizados', description: 'Organiza tu equipo por departamentos o roles', team: false, business: true, enterprise: true },
      { name: 'Administración avanzada de grupos', description: 'Control granular por grupo', team: false, business: false, enterprise: true },
      { name: 'Branding corporativo', description: 'Personaliza la plataforma con tu logo y colores', team: false, business: false, enterprise: true }
    ],
    'Análisis e Informes': [
      { name: 'Reportes básicos', description: 'Estadísticas de progreso y completación', team: true, business: true, enterprise: true },
      { name: 'Analytics avanzados', description: 'Análisis profundo de aprendizaje', team: false, business: true, enterprise: true },
      { name: 'Información de habilidades', description: 'Skills insights y gaps de conocimiento', team: false, business: true, enterprise: true },
      { name: 'Análisis de cursos', description: 'Performance y engagement por curso', team: false, business: true, enterprise: true },
      { name: 'Dashboard personalizado', description: 'Dashboards a medida por necesidad', team: false, business: false, enterprise: true },
      { name: 'Exportación de datos', description: 'Exporta reportes en múltiples formatos', team: false, business: false, enterprise: true }
    ],
    'Experiencia del Usuario': [
      { name: 'Acceso a catálogo completo', description: 'Todos los cursos disponibles', team: true, business: true, enterprise: true },
      { name: 'Certificaciones ilimitadas', description: 'Sin límite de certificaciones emitidas', team: false, business: true, enterprise: true },
      { name: 'Certificados personalizados', description: 'Diseño de certificados propio', team: false, business: false, enterprise: true },
      { name: 'Aplicación móvil', description: 'Acceso desde dispositivos móviles', team: true, business: true, enterprise: true },
      { name: 'Offline learning', description: 'Descarga cursos para ver offline', team: false, business: true, enterprise: true },
      { name: 'Cursos en vivo', description: 'Integración con Zoom/Google Meet para webinars', team: false, business: false, enterprise: true }
    ],
    'Notificaciones y Automatización': [
      { name: 'Notificaciones automáticas', description: 'Email y push cuando ocurren eventos importantes', team: true, business: true, enterprise: true },
      { name: 'Recordatorios inteligentes', description: 'Notificaciones de cursos pendientes y fechas límite', team: false, business: true, enterprise: true },
      { name: 'Integración con sistemas externos', description: 'Conexión con sistemas de RRHH y gestión', team: false, business: true, enterprise: true },
      { name: 'SSO empresarial', description: 'Single Sign-On con proveedores de identidad', team: false, business: true, enterprise: true },
      { name: 'Integración con calendarios', description: 'Google Calendar, Outlook para sesiones', team: false, business: true, enterprise: true },
      { name: 'API de datos', description: 'Acceso completo a datos via API REST', team: false, business: false, enterprise: true }
    ],
    'Soporte y Servicios': [
      { name: 'Soporte por email', description: 'Tiempo de respuesta 24-48 horas', team: true, business: true, enterprise: true },
      { name: 'Soporte prioritario', description: 'Respuesta rápida garantizada', team: false, business: true, enterprise: true },
      { name: 'Soporte 24/7 dedicado', description: 'Equipo dedicado disponible siempre', team: false, business: false, enterprise: true },
      { name: 'Customer Success Manager', description: 'Gerente de cuenta asignado', team: false, business: false, enterprise: true },
      { name: 'Onboarding personalizado', description: 'Capacitación a medida para tu equipo', team: false, business: false, enterprise: true },
      { name: 'Consultoría estratégica', description: 'Asesoría en estrategia de aprendizaje', team: false, business: false, enterprise: true }
    ]
  }

  const handleSelectPlan = (planId: string) => {
    if (planId === 'enterprise') {
      setSelectedPlan('enterprise')
      return
    }
    if (currentPlan === planId && currentBillingCycle === billingCycle) return
    setSelectedPlan(planId)
    setChangeError(null)
    setChangeSuccess(false)
  }

  const handleConfirmChange = async () => {
    if (!selectedPlan || selectedPlan === 'enterprise') return
    setIsChangingPlan(true)
    setChangeError(null)
    setChangeSuccess(false)
    try {
      const result = await changePlan(selectedPlan, billingCycle)
      if (result.success) {
        await refetch()
        await new Promise(resolve => setTimeout(resolve, 200))
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('subscription-plan-changed', {
            detail: { planId: selectedPlan, billingCycle }
          }))
        }
        setChangeSuccess(true)
        setSelectedPlan(null)
        setTimeout(() => { setChangeSuccess(false) }, 5000)
      } else {
        setChangeError(result.error || 'Error al cambiar el plan. Por favor, intenta nuevamente.')
      }
    } catch (error) {
      setChangeError(error instanceof Error ? error.message : 'Error desconocido al cambiar el plan. Por favor, intenta nuevamente.')
    } finally {
      setIsChangingPlan(false)
    }
  }

  const handleCancelChange = () => {
    setSelectedPlan(null)
    setChangeError(null)
    setChangeSuccess(false)
  }

  const changeInfo = useMemo(() => {
    if (!selectedPlan || selectedPlan === 'enterprise') return null
    const currentPlanConfig = currentPlan ? getPlanById(currentPlan) : null
    const newPlanConfig = getPlanById(selectedPlan)
    if (!newPlanConfig) return null
    const currentPrice = currentPlanConfig && currentBillingCycle
      ? calculatePlanPrice(currentPlanConfig.id as BusinessPlanId, currentBillingCycle)
      : 0
    const newPrice = calculatePlanPrice(newPlanConfig.id as BusinessPlanId, billingCycle)
    const currentPlanName = currentPlanConfig?.name || (currentPlan ? currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1) : 'Ninguno')
    return {
      currentPlan: currentPlanName,
      newPlan: newPlanConfig.name,
      currentPrice,
      newPrice,
      priceDifference: newPrice - currentPrice,
      currentBillingCycle: currentBillingCycle || 'yearly',
      newBillingCycle: billingCycle,
      currentPlanId: currentPlan || null,
      newPlanId: selectedPlan
    }
  }, [selectedPlan, currentPlan, currentBillingCycle, billingCycle])

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'team': return 'bg-[#0A2540]'
      case 'business': return 'bg-[#00D4B3]'
      case 'enterprise': return 'bg-[#F59E0B]'
      default: return 'bg-[#6C757D]'
    }
  }

  const calculateYearlySavings = (plan: Plan): number => {
    if (plan.price === 'Personalizado') return 0
    const monthlyTotal = plan.priceMonthly * 12
    const savings = monthlyTotal - plan.priceYearly
    const percentage = (savings / monthlyTotal) * 100
    return Math.round(percentage)
  }

  return {
    currentPlan,
    currentBillingCycle,
    subscription,
    planLoading,
    billingCycle, setBillingCycle,
    selectedPlan,
    setSelectedPlan,
    isChangingPlan,
    changeError,
    changeSuccess,
    plans,
    featuresByCategory,
    changeInfo,
    handleSelectPlan,
    handleConfirmChange,
    handleCancelChange,
    getPlanColor,
    calculateYearlySavings,
  }
}
