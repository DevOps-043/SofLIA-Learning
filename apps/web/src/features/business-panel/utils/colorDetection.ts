/**
 * Utilidad para detectar colores dominantes de una imagen usando Canvas API
 */

interface RGB {
  r: number
  g: number
  b: number
}

interface ColorPalette {
  color_primary: string
  color_secondary: string
  color_accent: string
}

/**
 * Convierte RGB a hexadecimal
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

/**
 * Calcula la distancia entre dos colores RGB
 */
function colorDistance(color1: RGB, color2: RGB): number {
  const rDiff = color1.r - color2.r
  const gDiff = color1.g - color2.g
  const bDiff = color1.b - color2.b
  return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff)
}

/**
 * Calcula la saturación de un color RGB
 */
function getSaturation(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  if (max === 0) return 0
  return delta / max
}

/**
 * Calcula la luminosidad de un color RGB
 */
function getLuminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

/**
 * Agrupa colores similares usando k-means simplificado
 */
function groupColors(colors: RGB[], k: number = 5): RGB[] {
  if (colors.length === 0) return []
  if (colors.length <= k) return colors

  // Inicializar centroides aleatorios
  const centroids: RGB[] = []
  for (let i = 0; i < k; i++) {
    const randomIndex = Math.floor(Math.random() * colors.length)
    centroids.push({ ...colors[randomIndex] })
  }

  // Iterar para agrupar
  for (let iteration = 0; iteration < 10; iteration++) {
    const clusters: RGB[][] = Array(k).fill(null).map(() => [])
    
    // Asignar cada color al centroide más cercano
    colors.forEach(color => {
      let minDistance = Infinity
      let closestCentroid = 0
      centroids.forEach((centroid, index) => {
        const distance = colorDistance(color, centroid)
        if (distance < minDistance) {
          minDistance = distance
          closestCentroid = index
        }
      })
      clusters[closestCentroid].push(color)
    })

    // Actualizar centroides
    centroids.forEach((centroid, index) => {
      const cluster = clusters[index]
      if (cluster.length > 0) {
        const avgR = Math.round(cluster.reduce((sum, c) => sum + c.r, 0) / cluster.length)
        const avgG = Math.round(cluster.reduce((sum, c) => sum + c.g, 0) / cluster.length)
        const avgB = Math.round(cluster.reduce((sum, c) => sum + c.b, 0) / cluster.length)
        centroids[index] = { r: avgR, g: avgG, b: avgB }
      }
    })
  }

  return centroids
}

/**
 * Detecta colores dominantes de una imagen
 */
export async function detectColorsFromImage(imageUrl: string): Promise<ColorPalette> {
  return new Promise((resolve, reject) => {
    // Validar que estamos en el navegador
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      reject(new Error('La detección de colores solo funciona en el navegador'))
      return
    }

    // Validar que Canvas API esté disponible
    if (typeof HTMLCanvasElement === 'undefined') {
      reject(new Error('Canvas API no está disponible en este navegador'))
      return
    }

    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      try {
        // Crear canvas
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          reject(new Error('No se pudo obtener el contexto del canvas'))
          return
        }

        // Redimensionar imagen para mejorar rendimiento (máximo 200px)
        const maxSize = 200
        let width = img.width
        let height = img.height
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width
            width = maxSize
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }
        }

        canvas.width = width
        canvas.height = height

        // Dibujar imagen en canvas
        ctx.drawImage(img, 0, 0, width, height)

        // Obtener datos de píxeles
        const imageData = ctx.getImageData(0, 0, width, height)
        const pixels = imageData.data

        // Extraer colores (muestrear cada 10 píxeles para mejor rendimiento)
        const colors: RGB[] = []
        for (let i = 0; i < pixels.length; i += 40) { // Cada 10 píxeles (4 bytes por píxel)
          const r = pixels[i]
          const g = pixels[i + 1]
          const b = pixels[i + 2]
          const a = pixels[i + 3]

          // Ignorar píxeles transparentes o muy oscuros/claros
          if (a > 128) {
            const luminance = getLuminance(r, g, b)
            if (luminance > 0.1 && luminance < 0.9) {
              colors.push({ r, g, b })
            }
          }
        }

        if (colors.length === 0) {
          // Si no hay colores válidos, usar valores por defecto
          resolve({
            color_primary: '#3b82f6',
            color_secondary: '#10b981',
            color_accent: '#8b5cf6'
          })
          return
        }

        // Agrupar colores similares
        const groupedColors = groupColors(colors, 8)

        // Ordenar por saturación y luminosidad (preferir colores vibrantes)
        const scoredColors = groupedColors.map(color => {
          const saturation = getSaturation(color.r, color.g, color.b)
          const luminance = getLuminance(color.r, color.g, color.b)
          const score = saturation * 0.7 + (1 - Math.abs(luminance - 0.5)) * 0.3
          return { color, score, saturation, luminance }
        })

        scoredColors.sort((a, b) => b.score - a.score)

        // Seleccionar colores
        const vibrant = scoredColors[0]?.color || { r: 59, g: 130, b: 246 }
        const muted = scoredColors.find(c => 
          c.saturation < 0.6 && c.luminance > 0.3 && c.luminance < 0.7
        )?.color || scoredColors[1]?.color || { r: 16, g: 185, b: 129 }
        const darkVibrant = scoredColors.find(c => 
          c.luminance < 0.5 && c.saturation > 0.5
        )?.color || scoredColors[2]?.color || { r: 139, g: 92, b: 246 }

        resolve({
          color_primary: rgbToHex(vibrant.r, vibrant.g, vibrant.b),
          color_secondary: rgbToHex(muted.r, muted.g, muted.b),
          color_accent: rgbToHex(darkVibrant.r, darkVibrant.g, darkVibrant.b)
        })
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error desconocido'
        reject(new Error(`Error al procesar la imagen: ${message}`))
      }
    }

    img.onerror = (error) => {
      console.error('Error cargando imagen para detección de colores:', error)
      reject(new Error('No se pudo cargar la imagen. Verifica que la URL sea válida, accesible y no tenga restricciones CORS.'))
    }

    // Establecer src después de configurar los handlers
    try {
      img.src = imageUrl
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'URL inválida'
      reject(new Error(`Error al establecer la URL de la imagen: ${message}`))
    }
  })
}
