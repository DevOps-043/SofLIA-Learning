'use client'

import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error a servicio de monitoreo (ej: Sentry)
    if (process.env.NODE_ENV === 'development') {
    }

    // Llamar callback personalizado si existe
    this.props.onError?.(error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      // Usar fallback personalizado si se proporciona
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Fallback por defecto
      return (
        <div className="min-h-screen bg-white dark:bg-[#0F1419] flex items-center justify-center px-4" style={{ fontFamily: 'Inter, sans-serif' }}>
          <div className="max-w-md w-full bg-white dark:bg-[#1E2329] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl shadow-sm p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/10 dark:bg-red-500/20 rounded-full mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>

            <h2 className="text-2xl font-bold text-[#0A2540] dark:text-white mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              Algo salió mal
            </h2>

            <p className="text-[#6C757D] dark:text-white/80 mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
              Lo sentimos, ocurrió un error inesperado. Por favor, intenta recargar la página.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-[#E9ECEF] dark:bg-[#0F1419] rounded-xl text-left">
                <p className="text-xs font-mono text-red-600 dark:text-red-400 break-all" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#0A2540] hover:bg-[#0d2f4d] text-white rounded-xl font-semibold transition-all shadow-sm"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <RefreshCw className="w-4 h-4" />
                Intentar de nuevo
              </button>

              <button
                onClick={() => (window.location.href = '/dashboard')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-[#E9ECEF] dark:border-[#6C757D]/30 bg-white dark:bg-[#1E2329] text-[#0A2540] dark:text-white hover:bg-[#E9ECEF] dark:hover:bg-[#0F1419] rounded-xl font-semibold transition-all"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Ir al inicio
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
