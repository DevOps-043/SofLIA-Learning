import { describe, expect, it } from 'vitest'

import { normalizeTextForSpeech } from '../tts-text-normalization'

describe('normalizeTextForSpeech', () => {
  describe('marcas y productos', () => {
    it('reescribe los nombres que un motor español pronuncia mal', () => {
      expect(normalizeTextForSpeech('Abre ChatGPT y NotebookLM')).toBe(
        'Abre Chat gepeté y Notebook ele eme',
      )
      expect(normalizeTextForSpeech('Bienvenido a SofLIA')).toBe('Bienvenido a Soflía')
      expect(normalizeTextForSpeech('Compara GPT-5 con Gemini')).toBe(
        'Compara gepeté 5 con Yémini',
      )
    })

    it('no toca las marcas que ya suenan bien en español', () => {
      const text = 'Usa Canva, Gamma y Excel'
      expect(normalizeTextForSpeech(text)).toBe(text)
    })

    it('la version del modelo no se confunde con un rango numérico', () => {
      // "GPT-4" debe quedar "gepeté 4", nunca "GPT a 4".
      expect(normalizeTextForSpeech('El modelo GPT-4 responde')).toBe(
        'El modelo gepeté 4 responde',
      )
    })
  })

  describe('siglas', () => {
    it('expande las siglas del dominio', () => {
      expect(normalizeTextForSpeech('El KPI de RRHH mide el ROI')).toBe(
        'El indicador clave de desempeño de recursos humanos mide el retorno de inversión',
      )
    })

    it('transcribe las siglas anglosajonas en vez de traducirlas al inglés', () => {
      // Meter "business to business" en una frase española reintroduce el
      // problema: el motor lo leería con fonética española.
      expect(normalizeTextForSpeech('Venta B2B y B2C')).toBe('Venta bi tu bi y bi tu ci')
    })

    it('nunca casa una sigla dentro de una palabra', () => {
      const text = 'La industria y los medios de la media nacional'
      expect(normalizeTextForSpeech(text)).toBe(text)
    })
  })

  describe('porcentajes, moneda y símbolos', () => {
    it('convierte el porcentaje a palabras con y sin espacio', () => {
      expect(normalizeTextForSpeech('Vas al 3,03 % del curso')).toBe(
        'Vas al 3,03 por ciento del curso',
      )
      expect(normalizeTextForSpeech('Vas al 3,03% del curso')).toBe(
        'Vas al 3,03 por ciento del curso',
      )
    })

    it('expande el euro en cualquiera de sus dos posiciones', () => {
      expect(normalizeTextForSpeech('Cuesta 250 €')).toBe('Cuesta 250 euros')
      expect(normalizeTextForSpeech('Cuesta €250')).toBe('Cuesta 250 euros')
    })

    it('expande los códigos ISO de moneda pero deja el "$" ambiguo intacto', () => {
      expect(normalizeTextForSpeech('Son 1200 USD o 20000 MXN')).toBe(
        'Son 1200 dólares o 20000 pesos mexicanos',
      )
      // Sin país no se puede decidir entre pesos y dólares: equivocarse es peor.
      expect(normalizeTextForSpeech('Son $1200')).toBe('Son $1200')
    })
  })

  describe('números con tipografía española', () => {
    it('elimina el punto de millar para que no se lea como decimal', () => {
      expect(normalizeTextForSpeech('Ahorra 1.500 al mes')).toBe('Ahorra 1500 al mes')
      expect(normalizeTextForSpeech('Factura 1.234.567 al año')).toBe(
        'Factura 1234567 al año',
      )
    })

    it('respeta la coma decimal y los puntos que no son de millar', () => {
      expect(normalizeTextForSpeech('El valor es 3,03 y la versión 2.5')).toBe(
        'El valor es 3,03 y la versión 2.5',
      )
    })

    it('convierte rangos de años sin romper fechas', () => {
      expect(normalizeTextForSpeech('Periodo 2020-2026')).toBe('Periodo 2020 a 2026')
      const fecha = 'La sesión del 12-03-2026'
      expect(normalizeTextForSpeech(fecha)).toBe(fecha)
    })
  })

  describe('contrato del módulo', () => {
    /**
     * El texto de las lecturas se normaliza en la pregeneración y OTRA VEZ en la
     * síntesis. Si una regla no fuera idempotente, la clave de caché dejaría de
     * coincidir y se re-sintetizaría audio ya pagado.
     */
    it('es idempotente en todas las clases de regla', () => {
      const samples = [
        'Abre ChatGPT, revisa el KPI de RRHH y avanza al 3,03 % de tu curso de IA.',
        'GPT-4 y NotebookLM cuestan 1.500 € en el periodo 2020-2026.',
        'SofLIA usa OpenAI, Gemini y n8n para automatizar procesos B2B.',
        'Son 1200 USD, n.º 4, con ROI del 25%.',
      ]

      for (const sample of samples) {
        const once = normalizeTextForSpeech(sample)
        expect(normalizeTextForSpeech(once)).toBe(once)
      }
    })

    it('deja intactos los idiomas sin reglas propias', () => {
      const text = 'Open ChatGPT and check the KPI at 3.03%'
      expect(normalizeTextForSpeech(text, 'en')).toBe(text)
      expect(normalizeTextForSpeech(text, 'pt')).toBe(text)
    })

    it('tolera texto vacío', () => {
      expect(normalizeTextForSpeech('')).toBe('')
    })
  })
})
