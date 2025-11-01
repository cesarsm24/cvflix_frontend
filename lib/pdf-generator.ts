import jsPDF from "jspdf"
import type { AnalysisReport, ColorPalette } from "./types"
import { Chart } from 'chart.js/auto'

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

/**
 * pdf-generator.ts
 *
 * Generador de reportes PDF estilo Netflix para análisis cinematográficos.
 * Utiliza jsPDF para composición de documentos y Chart.js para renderizado
 * de gráficos estadísticos sin manipulación DOM.
 *
 * Author: César Sánchez Montes
 * Course: Imagen Digital
 * Year: 2025
 * Version: 3.0.0
 *
 * Dependencies:
 *   - jspdf: Generación de documentos PDF
 *   - chart.js/auto: Renderizado de gráficos en canvas
 *   - @/lib/types: Definiciones de tipos TypeScript
 *
 * Usage:
 *   import { generateNetflixPDF } from '@/lib/pdf-generator'
 *
 *   await generateNetflixPDF(
 *     analysisReport,
 *     firstFrameUrl,
 *     posterUrl
 *   )
 *
 * Notes:
 *   Características del PDF:
 *     - Formato A4 vertical (210x297mm)
 *     - 7 páginas estructuradas con headers/footers uniformes
 *     - Paleta cromática Netflix (rojo #E50914, negro, grises)
 *     - Gráficos renderizados como imágenes base64
 *     - Márgenes consistentes de 20mm laterales
 *
 *   Estructura del documento:
 *     Página 1: Portada con poster y título
 *     Página 2: Actores detectados y distribución de planos
 *     Página 3: Análisis de emociones (donut + gauge)
 *     Página 4: Análisis de color (histograma + paleta)
 *     Página 5: Análisis cromático avanzado y composición
 *     Página 6: Análisis de iluminación (zonas, tipos, exposición)
 *     Página 7: Movimientos de cámara (donut + timeline)
 *
 *   Optimizaciones:
 *     - Gráficos generados en memoria sin DOM
 *     - Imágenes cargadas de forma asíncrona con manejo de errores
 *     - Proxy de imágenes para CORS en TMDB
 */

// ==================== CONFIGURACIÓN DE PALETA CROMÁTICA ====================

/**
 * Color primario de marca Netflix.
 * @constant
 */
const NETFLIX_RED = "#E50914"

/**
 * Variante oscura del rojo Netflix para contraste.
 * @constant
 */
const DARK_RED = "#B71C1C"

/**
 * Negro puro para fondos y textos de alto contraste.
 * @constant
 */
const BLACK = "#000000"

/**
 * Blanco puro para textos sobre fondos oscuros.
 * @constant
 */
const WHITE = "#FFFFFF"

/**
 * Gris oscuro para fondos secundarios.
 * @constant
 */
const DARK_GRAY = "#141414"

/**
 * Gris medio para textos secundarios.
 * @constant
 */
const MID_GRAY = "#757575"

/**
 * Gris claro para fondos de elementos UI.
 * @constant
 */
const LIGHT_GRAY = "#E5E5E5"

/**
 * Paleta de colores en formato RGB para jsPDF.
 *
 * Notes:
 *   jsPDF requiere colores en tuplas RGB [r, g, b] para setFillColor/setTextColor.
 */
const colors = {
  red: [229, 9, 20] as [number, number, number],
  darkRed: [183, 28, 28] as [number, number, number],
  black: [0, 0, 0] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  lightGray: [245, 245, 245] as [number, number, number],
  mediumGray: [117, 117, 117] as [number, number, number],
}

/**
 * Configuración de iconos y colores para emociones detectadas.
 *
 * Mapea cada emoción a un color natural representativo y un icono SVG
 * para visualización consistente en gráficos y gauges.
 *
 * @constant
 */
const EMOTION_CONFIG = {
  "Feliz": { color: "#4CAF50", icon: "smile" },
  "Triste": { color: "#2196F3", icon: "cloud-rain" },
  "Neutral": { color: "#9E9E9E", icon: "minus" },
  "Enfadado": { color: "#E50914", icon: "flame" },
  "Sorprendido": { color: "#FF9800", icon: "zap" },
  "Miedo": { color: "#9C27B0", icon: "skull" },
  "Disgustado": { color: "#795548", icon: "frown" }
}

// ==================== FUNCIONES DE CARGA DE RECURSOS ====================

/**
 * Carga logo de CVFlix desde directorio public.
 *
 * Convierte imagen PNG a formato base64 para inclusión en PDF.
 * Implementa fallback a null si logo no está disponible.
 *
 * @returns Promise con data URL base64 del logo o null si falla
 *
 * Notes:
 *   Flujo de carga:
 *     1. Crea elemento Image con ruta /logo.png
 *     2. Dibuja imagen en canvas temporal
 *     3. Extrae data URL mediante toDataURL()
 *     4. Retorna null en caso de error de carga
 */
async function loadLogo(): Promise<string | null> {
  try {
    const logoPath = '/logo.png'
    console.log(`🔍 Intentando cargar logo desde: ${logoPath}`)

    const img = new Image()

    return new Promise((resolve) => {
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas")
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext("2d")
          if (ctx) {
            ctx.drawImage(img, 0, 0)
            const dataUrl = canvas.toDataURL("image/png")
            console.log('✅ Logo cargado correctamente')
            resolve(dataUrl)
          } else {
            console.warn('⚠️ No se pudo obtener contexto del canvas para el logo')
            resolve(null)
          }
        } catch (error) {
          console.error('❌ Error convirtiendo logo a base64:', error)
          resolve(null)
        }
      }

      img.onerror = (error) => {
        console.warn('⚠️ No se pudo cargar el logo desde /logo.png, usando fallback de texto')
        resolve(null)
      }

      img.src = logoPath
    })
  } catch (error) {
    console.error('❌ Error en loadLogo:', error)
    return null
  }
}

/**
 * Crea icono SVG y lo convierte a imagen base64.
 *
 * Genera SVG programáticamente con path específico del icono,
 * lo convierte a blob y finalmente a data URL para uso en canvas.
 *
 * @param iconName - Nombre del icono (smile, cloud-rain, minus, frown, skull, zap, flame)
 * @param color - Color en formato hexadecimal
 * @param size - Tamaño del icono en píxeles (default: 32)
 * @returns Promise con data URL base64 del icono o string vacío si falla
 *
 * Notes:
 *   Iconos disponibles:
 *     - smile: Cara sonriente para emoción Feliz
 *     - cloud-rain: Nube con lluvia para emoción Triste
 *     - minus: Línea horizontal para emoción Neutral
 *     - frown: Cara triste para emoción Disgustado
 *     - skull: Calavera para emoción Miedo
 *     - zap: Rayo para emoción Sorprendido
 *     - flame: Llama para emoción Enfadado
 */
async function createIconSVG(iconName: string, color: string, size: number = 32): Promise<string> {
  const iconPaths: Record<string, string> = {
    "smile": '<path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="15" cy="9" r="1" fill="currentColor"/>',
    "cloud-rain": '<path d="M16 13v8M12 13v8M8 13v8M4 14.8C2.2 13.6 1 11.8 1 9.7 1 6.5 3.6 4 6.8 4c1.4 0 2.7.5 3.7 1.3C11.3 3.5 13.5 2 16 2c3.9 0 7 3.1 7 7 0 2.4-1.2 4.5-3 5.8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
    "minus": '<line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    "frown": '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><path d="M16 16s-1.5-2-4-2-4 2-4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="15" cy="9" r="1" fill="currentColor"/>',
    "skull": '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><path d="M9.5 9h.01M14.5 9h.01M10 14c.5.3 1.2.5 2 .5s1.5-.2 2-.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 17l.5-1.5M15 17l-.5-1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    "zap": '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
    "flame": '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'
  }

  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" style="color: ${color}">
      ${iconPaths[iconName] || iconPaths["minus"]}
    </svg>
  `

  return new Promise((resolve) => {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const img = new Image()

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')

      if (ctx) {
        ctx.drawImage(img, 0, 0)
        const dataUrl = canvas.toDataURL('image/png')
        URL.revokeObjectURL(url)
        resolve(dataUrl)
      } else {
        URL.revokeObjectURL(url)
        resolve('')
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve('')
    }

    img.src = url
  })
}

// ==================== FUNCIONES DE GENERACIÓN DE GRÁFICOS ====================

/**
 * Genera gráfico de barras horizontales para distribución de tipos de plano.
 *
 * Crea visualización de los 8 tipos de plano más frecuentes con barras
 * horizontales coloreadas en rojo oscuro. Incluye etiquetas con porcentajes
 * posicionadas dentro o fuera de las barras según su tamaño.
 *
 * @param data - Objeto con tipos de plano como claves y porcentajes como valores
 * @returns Promise con data URL base64 del gráfico o string vacío si falla
 *
 * Notes:
 *   Dimensiones del canvas: 900x500 píxeles
 *   Configuración de Chart.js:
 *     - Tipo: bar con indexAxis 'y' (horizontal)
 *     - Color: DARK_RED (#B71C1C)
 *     - Barras con borderRadius de 8px
 *     - Escala X: 0-100% sin ticks visibles
 *     - Escala Y: etiquetas en negrita, tamaño 16px
 *     - Plugin personalizado para etiquetas de porcentaje
 */
async function generateShotDistributionChart(
    data: Record<string, number>
): Promise<string> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 900
      canvas.height = 500

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve('')
        return
      }

      const sortedData = Object.entries(data)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 8)

      if (sortedData.length === 0) {
        resolve('')
        return
      }

      const chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: sortedData.map(([name]) => name),
          datasets: [{
            data: sortedData.map(([, value]) => value),
            backgroundColor: DARK_RED,
            borderRadius: 8,
            barThickness: 40
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: false,
          animation: false,
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false }
          },
          scales: {
            x: {
              display: true,
              beginAtZero: true,
              max: 100,
              grid: {
                display: true,
                color: 'rgba(0,0,0,0.05)'
              },
              ticks: {
                display: false
              }
            },
            y: {
              display: true,
              grid: { display: false },
              ticks: {
                display: true,
                font: {
                  size: 16,
                  weight: 'bold',
                  family: 'Arial, sans-serif'
                },
                color: BLACK,
                padding: 10,
                crossAlign: 'far'
              }
            }
          },
          layout: {
            padding: {
              left: 20,
              right: 60,
              top: 20,
              bottom: 20
            }
          }
        },
        plugins: [{
          id: 'barLabels',
          afterDatasetsDraw(chart) {
            const ctx = chart.ctx
            const meta = chart.getDatasetMeta(0)

            chart.data.datasets[0].data.forEach((value, index) => {
              const bar = meta.data[index]

              ctx.fillStyle = 'white'
              ctx.font = 'bold 18px sans-serif'
              ctx.textAlign = 'right'
              ctx.textBaseline = 'middle'

              const barWidth = (bar as any).width
              const barX = (bar as any).x
              const barY = (bar as any).y

              if (barWidth < 80) {
                ctx.fillStyle = BLACK
                ctx.fillText(
                    `${(value as number).toFixed(1)}%`,
                    barX + 40,
                    barY
                )
              } else {
                ctx.fillStyle = 'white'
                ctx.fillText(
                    `${(value as number).toFixed(1)}%`,
                    barX - 15,
                    barY
                )
              }
            })
          }
        }]
      })

      const imgData = canvas.toDataURL('image/png')
      chart.destroy()
      resolve(imgData)
    } catch (error) {
      console.error('Error generando shot distribution chart:', error)
      resolve('')
    }
  })
}

/**
 * Genera gráfico de donut para distribución de emociones.
 *
 * Crea visualización circular de las 7 emociones más frecuentes con
 * colores específicos por emoción. Incluye leyenda inferior y etiquetas
 * de porcentaje dentro de segmentos mayores al 5%.
 *
 * @param distribution - Objeto con emociones como claves y porcentajes como valores
 * @returns Promise con data URL base64 del gráfico o string vacío si falla
 *
 * Notes:
 *   Dimensiones del canvas: 700x700 píxeles
 *   Colores mapeados desde EMOTION_CONFIG:
 *     - Feliz: Verde (#4CAF50)
 *     - Triste: Azul (#2196F3)
 *     - Neutral: Gris (#9E9E9E)
 *     - Enfadado: Rojo (#E50914)
 *     - Sorprendido: Naranja (#FF9800)
 *     - Miedo: Morado (#9C27B0)
 *     - Disgustado: Marrón (#795548)
 */
async function generateEmotionDonutChart(
    distribution: Record<string, number>
): Promise<string> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 700
      canvas.height = 700

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve('')
        return
      }

      const emotions = Object.entries(distribution)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 7)

      if (emotions.length === 0) {
        resolve('')
        return
      }

      const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: emotions.map(([name]) => name),
          datasets: [{
            data: emotions.map(([, value]) => value),
            backgroundColor: emotions.map(([name]) =>
                EMOTION_CONFIG[name as keyof typeof EMOTION_CONFIG]?.color || "#757575"
            ),
            borderWidth: 5,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: false,
          animation: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                font: { size: 16, weight: 'bold' },
                color: BLACK,
                padding: 20,
                boxWidth: 30
              }
            },
            tooltip: { enabled: false }
          }
        },
        plugins: [{
          id: 'doughnutLabels',
          afterDatasetsDraw(chart) {
            const ctx = chart.ctx
            const meta = chart.getDatasetMeta(0)
            meta.data.forEach((arc: any, index) => {
              const value = emotions[index][1]
              if (value > 5) {
                const angle = (arc.startAngle + arc.endAngle) / 2
                const radius = (arc.innerRadius + arc.outerRadius) / 2
                const x = arc.x + Math.cos(angle) * radius
                const y = arc.y + Math.sin(angle) * radius

                ctx.fillStyle = 'white'
                ctx.font = 'bold 18px sans-serif'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillText(`${value.toFixed(1)}%`, x, y)
              }
            })
          }
        }]
      })

      const imgData = canvas.toDataURL('image/png')
      chart.destroy()
      resolve(imgData)
    } catch (error) {
      console.error('Error generando emotion donut chart:', error)
      resolve('')
    }
  })
}

/**
 * Genera medidor semicircular (gauge) de emoción dominante.
 *
 * Crea visualización de semicírculo con 7 segmentos coloreados por emoción,
 * aguja indicadora apuntando a la emoción dominante, y símbolos Unicode
 * posicionados en cada segmento.
 *
 * @param dominantEmotion - Nombre de la emoción predominante
 * @param percentage - Porcentaje de aparición de la emoción dominante
 * @returns Promise con data URL base64 del gráfico o string vacío si falla
 *
 * Notes:
 *   Dimensiones del canvas: 700x700 píxeles
 *   Distribución angular: 180° divididos en 7 segmentos de 25.7° cada uno
 *   Orden de emociones (izquierda a derecha):
 *     Feliz → Sorprendido → Neutral → Disgustado → Miedo → Triste → Enfadado
 *   Centro: coordenadas (350, 380) con radio de 220px
 *   Símbolos Unicode utilizados:
 *     Feliz: ☺, Sorprendido: ⚡, Neutral: −, Disgustado: ☹
 *     Miedo: ☠, Triste: ☁, Enfadado: 🔥
 */
async function generateEmotionGaugeChart(
    dominantEmotion: string,
    percentage: number
): Promise<string> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 700
      canvas.height = 700

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve('')
        return
      }

      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const centerX = 350
      const centerY = 380
      const radius = 220

      const emotions = [
        { name: "Feliz", color: "#4CAF50", start: 0, end: 25.7 },
        { name: "Sorprendido", color: "#FF9800", start: 25.7, end: 51.4 },
        { name: "Neutral", color: "#9E9E9E", start: 51.4, end: 77.1 },
        { name: "Disgustado", color: "#795548", start: 77.1, end: 102.8 },
        { name: "Miedo", color: "#9C27B0", start: 102.8, end: 128.5 },
        { name: "Triste", color: "#2196F3", start: 128.5, end: 154.2 },
        { name: "Enfadado", color: "#E50914", start: 154.2, end: 180 }
      ]

      ctx.lineWidth = 35
      emotions.forEach(emotion => {
        ctx.beginPath()
        ctx.arc(
            centerX,
            centerY,
            radius,
            (emotion.start - 180) * Math.PI / 180,
            (emotion.end - 180) * Math.PI / 180
        )
        ctx.strokeStyle = emotion.color
        ctx.stroke()
      })

      emotions.forEach(async (emotion) => {
        const angle = (emotion.start + emotion.end) / 2
        const angleRad = (angle - 180) * Math.PI / 180
        const iconRadius = 280
        const x = centerX + iconRadius * Math.cos(angleRad)
        const y = centerY + iconRadius * Math.sin(angleRad)

        const symbols: Record<string, string> = {
          "Feliz": "☺",
          "Sorprendido": "⚡",
          "Neutral": "−",
          "Disgustado": "☹",
          "Miedo": "☠",
          "Triste": "☁",
          "Enfadado": "🔥"
        }

        ctx.font = '34px Arial'
        ctx.fillStyle = emotion.color
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(symbols[emotion.name] || "○", x, y)
      })

      const emotion = emotions.find(e => e.name === dominantEmotion)
      const angle = emotion ? (emotion.start + emotion.end) / 2 : 90

      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      const needleAngle = (angle - 180) * Math.PI / 180
      ctx.lineTo(
          centerX + (radius - 25) * Math.cos(needleAngle),
          centerY + (radius - 25) * Math.sin(needleAngle)
      )
      ctx.strokeStyle = BLACK
      ctx.lineWidth = 6
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(centerX, centerY, 12, 0, 2 * Math.PI)
      ctx.fillStyle = BLACK
      ctx.fill()
      ctx.beginPath()
      ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI)
      ctx.fillStyle = WHITE
      ctx.fill()

      const symbols: Record<string, string> = {
        "Feliz": "☺",
        "Sorprendido": "⚡",
        "Neutral": "−",
        "Disgustado": "☹",
        "Miedo": "☠",
        "Triste": "☁",
        "Enfadado": "🔥"
      }

      const emotionSymbol = symbols[dominantEmotion] || "○"
      ctx.font = 'bold 64px Arial'
      ctx.fillStyle = emotion?.color || BLACK
      ctx.textAlign = 'center'
      ctx.fillText(emotionSymbol, centerX, centerY + 90)

      ctx.font = 'bold 32px sans-serif'
      ctx.fillStyle = BLACK
      ctx.fillText(dominantEmotion, centerX, centerY + 150)

      ctx.font = '22px sans-serif'
      ctx.fillStyle = MID_GRAY
      ctx.fillText(`${percentage.toFixed(1)}% del contenido`, centerX, centerY + 185)

      const imgData = canvas.toDataURL('image/png')
      resolve(imgData)
    } catch (error) {
      console.error('Error generando emotion gauge:', error)
      resolve('')
    }
  })
}

/**
 * Genera histograma RGB de distribución de colores.
 *
 * Crea gráfico de líneas superpuestas para canales rojo, verde y azul
 * mostrando frecuencia de intensidad de 0-255. Implementa relleno
 * semitransparente bajo cada curva para mejor legibilidad.
 *
 * @param data - Objeto con arrays de frecuencias para canales r, g, b
 * @returns Promise con data URL base64 del gráfico o string vacío si falla
 *
 * Notes:
 *   Dimensiones del canvas: 900x350 píxeles
 *   Colores de canales:
 *     - Rojo: rgba(229, 9, 20, 0.8) con relleno al 15%
 *     - Verde: rgba(76, 175, 80, 0.8) con relleno al 15%
 *     - Azul: rgba(33, 150, 243, 0.8) con relleno al 15%
 *   Suavizado: tension 0.3 para curvas suaves
 *   Escala X: 256 valores (0-255) con máximo 10 ticks visibles
 */
async function generateColorHistogramChart(
    data: { r: number[]; g: number[]; b: number[] }
): Promise<string> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 900
      canvas.height = 350

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve('')
        return
      }

      const labels = Array.from({ length: 256 }, (_, i) => i)

      const chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Rojo',
              data: data.r,
              borderColor: 'rgba(229, 9, 20, 0.8)',
              backgroundColor: 'rgba(229, 9, 20, 0.15)',
              fill: true,
              borderWidth: 2.5,
              pointRadius: 0,
              tension: 0.3
            },
            {
              label: 'Verde',
              data: data.g,
              borderColor: 'rgba(76, 175, 80, 0.8)',
              backgroundColor: 'rgba(76, 175, 80, 0.15)',
              fill: true,
              borderWidth: 2.5,
              pointRadius: 0,
              tension: 0.3
            },
            {
              label: 'Azul',
              data: data.b,
              borderColor: 'rgba(33, 150, 243, 0.8)',
              backgroundColor: 'rgba(33, 150, 243, 0.15)',
              fill: true,
              borderWidth: 2.5,
              pointRadius: 0,
              tension: 0.3
            }
          ]
        },
        options: {
          responsive: false,
          animation: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                font: { size: 14, weight: 'bold' },
                color: BLACK,
                boxWidth: 35,
                padding: 15
              }
            },
            tooltip: { enabled: false }
          },
          scales: {
            x: {
              display: true,
              grid: { display: false },
              ticks: {
                maxTicksLimit: 10,
                font: { size: 11 },
                color: MID_GRAY
              }
            },
            y: {
              display: true,
              grid: { color: 'rgba(0,0,0,0.06)' },
              ticks: {
                font: { size: 11 },
                color: MID_GRAY
              }
            }
          }
        }
      })

      const imgData = canvas.toDataURL('image/png')
      chart.destroy()
      resolve(imgData)
    } catch (error) {
      console.error('Error generando histogram:', error)
      resolve('')
    }
  })
}

/**
 * Genera gráfico de análisis de esquema cromático.
 *
 * Visualiza esquema de color dominante (monocromático, análogo, complementario)
 * con muestra de colores principales, barra de diferencia angular de matiz
 * y nivel de contraste calculado.
 *
 * @param scheme - Nombre del esquema cromático detectado
 * @param maxHueDifference - Diferencia angular máxima entre matices (0-180°)
 * @param dominantColors - Array de hasta 3 colores dominantes con hex, rgb y frecuencia
 * @returns Promise con data URL base64 del gráfico o string vacío si falla
 *
 * Notes:
 *   Dimensiones del canvas: 700x400 píxeles
 *   Estructura visual:
 *     - Título del esquema en recuadro negro (250x50px)
 *     - Muestra de colores: hasta 3 cuadrados de 80x80px
 *     - Barra de diferencia angular con gradiente gris→rojo→rojo oscuro
 *     - Etiquetas: 0° (Monocromático) a 180° (Complementario)
 *   Niveles de contraste:
 *     - Muy Bajo: 0-15°
 *     - Bajo: 15-30°
 *     - Moderado: 30-60°
 *     - Alto: 60-120°
 *     - Muy Alto: 120-180°
 */
async function generateColorSchemeChart(
    scheme: string,
    maxHueDifference: number,
    dominantColors: ColorPalette[]
): Promise<string> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 700
      canvas.height = 400

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve('')
        return
      }

      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.font = 'bold 22px sans-serif'
      ctx.fillStyle = BLACK
      ctx.textAlign = 'center'
      ctx.fillText('Esquema Cromático', 350, 35)

      ctx.fillStyle = BLACK
      ctx.fillRect(225, 60, 250, 50)
      ctx.font = 'bold 18px sans-serif'
      ctx.fillStyle = WHITE
      ctx.textAlign = 'center'
      ctx.fillText(scheme.toUpperCase(), 350, 92)

      const colors = dominantColors
          .filter(c => {
            if (!c) return false
            const hasHex = typeof c.hex === 'string' && c.hex.length > 0
            const hasRgb = Array.isArray(c.rgb) && c.rgb.length >= 3
            const freq = c.percentage || c.frequency || (c as any).appearances || 0
            const hasFreq = typeof freq === 'number' && freq >= 0
            return hasHex && hasRgb && hasFreq
          })
          .slice(0, 3)

      if (colors.length === 0) {
        ctx.font = '16px sans-serif'
        ctx.fillStyle = BLACK
        ctx.textAlign = 'center'
        ctx.fillText('Datos insuficientes', 350, 250)
        resolve(canvas.toDataURL('image/png'))
        return
      }

      const boxWidth = 100
      const startX = 350 - (colors.length * boxWidth) / 2

      colors.forEach((color, index) => {
        const x = startX + index * boxWidth + 10

        ctx.fillStyle = color.hex
        ctx.fillRect(x, 135, boxWidth - 20, boxWidth - 20)

        ctx.strokeStyle = '#ccc'
        ctx.lineWidth = 2
        ctx.strokeRect(x, 135, boxWidth - 20, boxWidth - 20)

        ctx.font = '12px monospace'
        ctx.fillStyle = BLACK
        ctx.textAlign = 'center'
        ctx.fillText(color.hex.toUpperCase(), x + (boxWidth - 20) / 2, 220)

        ctx.font = '11px sans-serif'
        ctx.fillStyle = MID_GRAY
        const freq = color.percentage || color.frequency || (color as any).appearances || 0
        ctx.fillText(`${freq.toFixed(1)}%`, x + (boxWidth - 20) / 2, 237)
      })

      ctx.font = 'bold 16px sans-serif'
      ctx.fillStyle = BLACK
      ctx.textAlign = 'left'
      ctx.fillText('Diferencia Angular de Matiz', 70, 275)

      ctx.font = 'bold 16px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(`${maxHueDifference.toFixed(1)}°`, 630, 275)

      const barWidth = 560
      const barX = 70
      const barY = 290

      ctx.fillStyle = '#f0f0f0'
      ctx.fillRect(barX, barY, barWidth, 35)

      const fillWidth = (maxHueDifference / 180) * barWidth
      const gradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0)
      gradient.addColorStop(0, '#9E9E9E')
      gradient.addColorStop(0.5, '#D32F2F')
      gradient.addColorStop(1, '#8B0000')

      ctx.fillStyle = gradient
      ctx.fillRect(barX, barY, fillWidth, 35)

      ctx.strokeStyle = '#ccc'
      ctx.lineWidth = 1
      ctx.strokeRect(barX, barY, barWidth, 35)

      if (maxHueDifference > 20) {
        ctx.font = 'bold 14px sans-serif'
        ctx.fillStyle = WHITE
        ctx.textAlign = 'right'
        ctx.fillText(`${maxHueDifference.toFixed(1)}°`, barX + fillWidth - 8, barY + 22)
      }

      ctx.font = '11px sans-serif'
      ctx.fillStyle = MID_GRAY
      ctx.textAlign = 'left'
      ctx.fillText('0° (Monocromático)', barX, barY + 52)
      ctx.textAlign = 'right'
      ctx.fillText('180° (Complementario)', barX + barWidth, barY + 52)

      let contrastLevel = "Muy Bajo"
      if (maxHueDifference >= 120) contrastLevel = "Muy Alto"
      else if (maxHueDifference >= 60) contrastLevel = "Alto"
      else if (maxHueDifference >= 30) contrastLevel = "Moderado"
      else if (maxHueDifference >= 15) contrastLevel = "Bajo"

      ctx.font = 'bold 16px sans-serif'
      ctx.fillStyle = BLACK
      ctx.textAlign = 'left'
      ctx.fillText('Nivel de Contraste:', 70, 365)

      ctx.font = 'bold 16px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(contrastLevel, 630, 365)

      const imgData = canvas.toDataURL('image/png')
      resolve(imgData)
    } catch (error) {
      console.error('Error generando color scheme chart:', error)
      resolve('')
    }
  })
}

/**
 * Genera gauge de temperatura de color.
 *
 * Visualiza temperatura cromática mediante barra horizontal con gradiente
 * de azul (frío) a naranja (cálido), indicador de posición y conversión
 * aproximada a escala Kelvin.
 *
 * @param temperature - Objeto con etiqueta descriptiva y valor normalizado (-1 a 1)
 * @returns Promise con data URL base64 del gráfico o string vacío si falla
 *
 * Notes:
 *   Dimensiones del canvas: 700x350 píxeles
 *   Barra de temperatura: 600x55px con gradiente de 7 stops
 *   Gradiente de colores:
 *     0.0: Azul frío (#1E88E5)
 *     0.2: Azul medio (#42A5F5)
 *     0.35: Azul claro (#90CAF9)
 *     0.5: Neutral (#E0E0E0)
 *     0.65: Naranja claro (#FFB74D)
 *     0.8: Naranja (#FF9800)
 *     1.0: Naranja cálido (#E64A19)
 *   Conversión Kelvin: valor -1 → 2000K, valor 1 → 10000K
 *   Interpretaciones:
 *     - value > 0.2: Tonos cálidos (naranjas/rojos)
 *     - -0.1 ≤ value ≤ 0.2: Equilibrada (luz de día)
 *     - value < -0.1: Tonos fríos (azules)
 */
async function generateColorTemperatureGauge(
    temperature: { label: string; value: number }
): Promise<string> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 700
      canvas.height = 350

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve('')
        return
      }

      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.font = 'bold 22px sans-serif'
      ctx.fillStyle = BLACK
      ctx.textAlign = 'center'
      ctx.fillText('Temperatura de Color', 350, 30)

      const barWidth = 600
      const barHeight = 55
      const barX = 50
      const barY = 60

      const gradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0)
      gradient.addColorStop(0, '#1E88E5')
      gradient.addColorStop(0.2, '#42A5F5')
      gradient.addColorStop(0.35, '#90CAF9')
      gradient.addColorStop(0.5, '#E0E0E0')
      gradient.addColorStop(0.65, '#FFB74D')
      gradient.addColorStop(0.8, '#FF9800')
      gradient.addColorStop(1, '#E64A19')

      ctx.fillStyle = gradient
      ctx.fillRect(barX, barY, barWidth, barHeight)

      ctx.strokeStyle = '#ccc'
      ctx.lineWidth = 2
      ctx.strokeRect(barX, barY, barWidth, barHeight)

      const percentage = ((temperature.value + 1) / 2) * 100
      const indicatorX = barX + (percentage / 100) * barWidth

      ctx.fillStyle = BLACK
      ctx.fillRect(indicatorX - 3, barY - 12, 6, barHeight + 24)

      ctx.beginPath()
      ctx.moveTo(indicatorX, barY - 12)
      ctx.lineTo(indicatorX - 8, barY - 22)
      ctx.lineTo(indicatorX + 8, barY - 22)
      ctx.closePath()
      ctx.fill()

      ctx.beginPath()
      ctx.moveTo(indicatorX, barY + barHeight + 12)
      ctx.lineTo(indicatorX - 8, barY + barHeight + 22)
      ctx.lineTo(indicatorX + 8, barY + barHeight + 22)
      ctx.closePath()
      ctx.fill()

      ctx.font = '12px sans-serif'
      ctx.fillStyle = MID_GRAY
      ctx.textAlign = 'left'
      ctx.fillText('Frío (2000K)', barX, barY + barHeight + 40)
      ctx.textAlign = 'center'
      ctx.fillText('Neutral (6000K)', barX + barWidth / 2, barY + barHeight + 40)
      ctx.textAlign = 'right'
      ctx.fillText('Cálido (10000K)', barX + barWidth, barY + barHeight + 40)

      const kelvinApprox = Math.round(2000 + (temperature.value + 1) * 4000)

      ctx.font = 'bold 38px sans-serif'
      ctx.fillStyle = BLACK
      ctx.textAlign = 'center'
      ctx.fillText(temperature.label, 350, 200)

      ctx.font = '22px sans-serif'
      ctx.fillStyle = MID_GRAY
      ctx.fillText(`~${kelvinApprox}K`, 350, 230)

      ctx.font = '15px sans-serif'
      ctx.fillText(`Valor: ${temperature.value.toFixed(2)}`, 350, 255)

      ctx.font = '13px sans-serif'
      ctx.fillStyle = MID_GRAY
      let interpretation = ''
      if (temperature.value > 0.2) {
        interpretation = 'Tonos cálidos predominantes (naranjas/rojos)'
      } else if (temperature.value >= -0.1) {
        interpretation = 'Temperatura equilibrada (luz de día)'
      } else {
        interpretation = 'Tonos fríos predominantes (azules)'
      }
      ctx.textAlign = 'center'
      ctx.fillText(interpretation, 350, 300)

      const imgData = canvas.toDataURL('image/png')
      resolve(imgData)
    } catch (error) {
      console.error('Error generando temperature gauge:', error)
      resolve('')
    }
  })
}

/**
 * Genera gráfico radar de análisis de composición visual.
 *
 * Crea visualización de 4 métricas de composición (regla de tercios,
 * simetría, balance, profundidad) en formato radar con escala 0-1.
 *
 * @param data - Objeto con valores normalizados de métricas de composición
 * @returns Promise con data URL base64 del gráfico o string vacío si falla
 *
 * Notes:
 *   Dimensiones del canvas: 600x600 píxeles
 *   Métricas visualizadas:
 *     - rule_of_thirds: Adherencia a regla de los tercios
 *     - symmetry: Nivel de simetría vertical/horizontal
 *     - balance: Equilibrio de peso visual
 *     - depth_cues: Indicadores de profundidad (perspectiva, solapamiento)
 *   Escala radial: 0.0 a 1.0 con pasos de 0.25
 *   Color: DARK_RED (#B71C1C) con relleno al 25% de opacidad
 *   Puntos de datos: círculos de 8px con borde blanco
 */
async function generateCompositionRadarChart(
    data: { rule_of_thirds: number; symmetry: number; balance: number; depth_cues: number }
): Promise<string> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 600
      canvas.height = 600

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve('')
        return
      }

      const chart = new Chart(ctx, {
        type: 'radar',
        data: {
          labels: ['Regla de Tercios', 'Simetría', 'Balance', 'Profundidad'],
          datasets: [{
            data: [
              data.rule_of_thirds,
              data.symmetry,
              data.balance,
              data.depth_cues
            ],
            backgroundColor: 'rgba(183, 28, 28, 0.25)',
            borderColor: DARK_RED,
            borderWidth: 4,
            pointBackgroundColor: DARK_RED,
            pointBorderColor: WHITE,
            pointBorderWidth: 3,
            pointRadius: 8
          }]
        },
        options: {
          responsive: false,
          animation: false,
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false }
          },
          scales: {
            r: {
              min: 0,
              max: 1,
              ticks: {
                stepSize: 0.25,
                font: { size: 12 },
                color: MID_GRAY,
                backdropColor: 'transparent'
              },
              grid: {
                color: 'rgba(0,0,0,0.12)'
              },
              pointLabels: {
                font: { size: 15, weight: 'bold' },
                color: BLACK
              }
            }
          }
        }
      })

      const imgData = canvas.toDataURL('image/png')
      chart.destroy()
      resolve(imgData)
    } catch (error) {
      console.error('Error generando composition radar:', error)
      resolve('')
    }
  })
}

/**
 * Genera gráfico de distribución de zonas de iluminación.
 *
 * Visualiza porcentaje de píxeles en tres rangos de luminosidad mediante
 * barras horizontales con colores representativos de cada zona.
 *
 * @param zones - Objeto con proporciones de sombras, medios tonos y altas luces
 * @returns Promise con data URL base64 del gráfico o string vacío si falla
 *
 * Notes:
 *   Dimensiones del canvas: 700x350 píxeles
 *   Zonas de luminosidad (escala 0-255):
 *     - Sombras: 0-85 (color: #212121 negro profundo)
 *     - Medios Tonos: 85-170 (color: #757575 gris medio)
 *     - Altas Luces: 170-255 (color: #BDBDBD gris claro)
 *   Barras: 550x50px con fondo #f0f0f0 y relleno proporcional
 *   Etiquetas de porcentaje:
 *     - Dentro de barra si valor > 15%
 *     - Color blanco para zonas oscuras, negro para zona clara
 */
async function generateLightingZonesChart(
    zones: { shadows: number; midtones: number; highlights: number }
): Promise<string> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 700
      canvas.height = 350

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve('')
        return
      }

      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.font = 'bold 20px sans-serif'
      ctx.fillStyle = BLACK
      ctx.textAlign = 'center'
      ctx.fillText('Distribución de Zonas de Luz', 350, 30)

      const shadowsPercent = zones.shadows * 100
      const midtonesPercent = zones.midtones * 100
      const highlightsPercent = zones.highlights * 100

      const zoneData = [
        { name: 'Sombras (0-85)', value: shadowsPercent, color: '#212121' },
        { name: 'Medios Tonos (85-170)', value: midtonesPercent, color: '#757575' },
        { name: 'Altas Luces (170-255)', value: highlightsPercent, color: '#BDBDBD' }
      ]

      let yPos = 65
      zoneData.forEach((zone, index) => {
        ctx.font = 'bold 16px sans-serif'
        ctx.fillStyle = BLACK
        ctx.textAlign = 'left'
        ctx.fillText(zone.name, 60, yPos + 18)

        ctx.textAlign = 'right'
        ctx.fillText(`${zone.value.toFixed(1)}%`, 640, yPos + 18)

        const barWidth = 550
        const barHeight = 50
        const barX = 60
        const barY = yPos + 28

        ctx.fillStyle = '#f0f0f0'
        ctx.fillRect(barX, barY, barWidth, barHeight)

        const fillWidth = (zone.value / 100) * barWidth
        ctx.fillStyle = zone.color
        ctx.fillRect(barX, barY, fillWidth, barHeight)

        ctx.strokeStyle = '#ccc'
        ctx.lineWidth = 1
        ctx.strokeRect(barX, barY, barWidth, barHeight)

        if (zone.value > 15) {
          ctx.font = 'bold 14px sans-serif'
          ctx.fillStyle = (index === 2) ? BLACK : WHITE
          ctx.textAlign = 'right'
          ctx.fillText(`${zone.value.toFixed(1)}%`, barX + fillWidth - 12, barY + barHeight / 2 + 6)
        }

        yPos += 90
      })

      const imgData = canvas.toDataURL('image/png')
      resolve(imgData)
    } catch (error) {
      console.error('Error generando lighting zones:', error)
      resolve('')
    }
  })
}

/**
 * Genera gráfico de barras horizontales para tipos de iluminación.
 *
 * Visualiza distribución de hasta 6 tipos de iluminación más frecuentes
 * (High-key, Low-key, Normal, Natural, Artificial, Mixed) con colores
 * representativos en escala de grises.
 *
 * @param distribution - Objeto con tipos de iluminación como claves y porcentajes como valores
 * @returns Promise con data URL base64 del gráfico o string vacío si falla
 *
 * Notes:
 *   Dimensiones del canvas: 700x350 píxeles
 *   Colores por tipo:
 *     - High-key: #BDBDBD (gris claro)
 *     - Low-key: #212121 (negro profundo)
 *     - Normal: #757575 (gris medio)
 *     - Natural: #9E9E9E (gris neutro)
 *     - Artificial: #616161 (gris oscuro)
 *     - Mixed: #424242 (gris muy oscuro)
 *   Barras con borderRadius de 6px
 *   Etiquetas de porcentaje en blanco dentro de barras
 */
async function generateLightingTypesChart(
    distribution: Record<string, number>
): Promise<string> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 700
      canvas.height = 350

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve('')
        return
      }

      const sortedData = Object.entries(distribution)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 6)

      if (sortedData.length === 0) {
        resolve('')
        return
      }

      const LIGHTING_COLORS = {
        "High-key": "#BDBDBD",
        "Low-key": "#212121",
        "Normal": "#757575",
        "Natural": "#9E9E9E",
        "Artificial": "#616161",
        "Mixed": "#424242"
      }

      const chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: sortedData.map(([name]) => name),
          datasets: [{
            data: sortedData.map(([, value]) => value),
            backgroundColor: sortedData.map(([name]) =>
                LIGHTING_COLORS[name as keyof typeof LIGHTING_COLORS] || "#757575"
            ),
            borderRadius: 6,
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: false,
          animation: false,
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
            title: {
              display: true,
              text: 'Tipos de Iluminación',
              font: { size: 20, weight: 'bold' },
              color: BLACK,
              padding: { bottom: 25 }
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              max: 100,
              grid: { display: false },
              ticks: {
                callback: (value) => `${value}%`,
                font: { size: 12 },
                color: MID_GRAY
              }
            },
            y: {
              grid: { display: false },
              ticks: {
                font: { size: 14, weight: 'bold' },
                color: BLACK
              }
            }
          }
        },
        plugins: [{
          id: 'barLabels',
          afterDatasetsDraw(chart) {
            const ctx = chart.ctx
            chart.data.datasets[0].data.forEach((value, index) => {
              const meta = chart.getDatasetMeta(0)
              const bar = meta.data[index]
              ctx.fillStyle = 'white'
              ctx.font = 'bold 14px sans-serif'
              ctx.textAlign = 'right'
              ctx.textBaseline = 'middle'
              ctx.fillText(
                  `${(value as number).toFixed(1)}%`,
                  (bar as any).x - 12,
                  (bar as any).y
              )
            })
          }
        }]
      })

      const imgData = canvas.toDataURL('image/png')
      chart.destroy()
      resolve(imgData)
    } catch (error) {
      console.error('Error generando lighting types:', error)
      resolve('')
    }
  })
}

/**
 * Genera gauge de control de exposición.
 *
 * Visualiza porcentaje de píxeles sobreexpuestos (quemados) y subexpuestos
 * (perdidos) mediante barras horizontales con indicadores de alerta.
 *
 * @param overexposed - Proporción de píxeles sobreexpuestos (0-1)
 * @param underexposed - Proporción de píxeles subexpuestos (0-1)
 * @returns Promise con data URL base64 del gráfico o string vacío si falla
 *
 * Notes:
 *   Dimensiones del canvas: 700x350 píxeles
 *   Barras de exposición: 550x45px con escala 0-10%
 *   Colores:
 *     - Sobreexposición: #B71C1C (rojo oscuro)
 *     - Subexposición: #212121 (negro)
 *   Interpretación:
 *     - Si overexposed > 1% O underexposed > 1%:
 *       "⚠️ Atención: Pérdida significativa de información"
 *     - Si ambos ≤ 1%:
 *       "✓ Exposición controlada correctamente"
 */
async function generateExposureGauge(
    overexposed: number,
    underexposed: number
): Promise<string> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 700
      canvas.height = 350

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve('')
        return
      }

      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.font = 'bold 20px sans-serif'
      ctx.fillStyle = BLACK
      ctx.textAlign = 'center'
      ctx.fillText('Control de Exposición', 350, 30)

      ctx.font = 'bold 16px sans-serif'
      ctx.fillStyle = BLACK
      ctx.textAlign = 'left'
      ctx.fillText('Píxeles Quemados (Sobreexposición)', 60, 80)

      const overPercent = overexposed * 100
      ctx.textAlign = 'right'
      ctx.fillText(`${overPercent.toFixed(2)}%`, 640, 80)

      const barWidth = 550
      const barHeight = 45

      ctx.fillStyle = '#f0f0f0'
      ctx.fillRect(60, 95, barWidth, barHeight)

      const overFillWidth = (overPercent / 10) * barWidth
      ctx.fillStyle = '#B71C1C'
      ctx.fillRect(60, 95, Math.min(overFillWidth, barWidth), barHeight)

      ctx.strokeStyle = '#ccc'
      ctx.lineWidth = 1
      ctx.strokeRect(60, 95, barWidth, barHeight)

      ctx.font = 'bold 16px sans-serif'
      ctx.fillStyle = BLACK
      ctx.textAlign = 'left'
      ctx.fillText('Píxeles Perdidos (Subexposición)', 60, 195)

      const underPercent = underexposed * 100
      ctx.textAlign = 'right'
      ctx.fillText(`${underPercent.toFixed(2)}%`, 640, 195)

      ctx.fillStyle = '#f0f0f0'
      ctx.fillRect(60, 210, barWidth, barHeight)

      const underFillWidth = (underPercent / 10) * barWidth
      ctx.fillStyle = '#212121'
      ctx.fillRect(60, 210, Math.min(underFillWidth, barWidth), barHeight)

      ctx.strokeStyle = '#ccc'
      ctx.lineWidth = 1
      ctx.strokeRect(60, 210, barWidth, barHeight)

      ctx.font = '14px sans-serif'
      ctx.fillStyle = MID_GRAY
      ctx.textAlign = 'center'
      let interpretation = ''
      if (overPercent > 1 || underPercent > 1) {
        interpretation = '⚠️ Atención: Pérdida significativa de información'
      } else {
        interpretation = '✓ Exposición controlada correctamente'
      }
      ctx.fillText(interpretation, 350, 295)

      const imgData = canvas.toDataURL('image/png')
      resolve(imgData)
    } catch (error) {
      console.error('Error generando exposure gauge:', error)
      resolve('')
    }
  })
}

/**
 * Genera gráfico de donut para distribución de movimientos de cámara.
 *
 * Visualiza hasta 7 tipos de movimiento más frecuentes (Estático, Pan,
 * Tilt, Zoom, Tracking, Dolly, Crane) con colores en escala de grises
 * y etiquetas de porcentaje en segmentos mayores al 5%.
 *
 * @param distribution - Objeto con tipos de movimiento como claves y porcentajes como valores
 * @returns Promise con data URL base64 del gráfico o string vacío si falla
 *
 * Notes:
 *   Dimensiones del canvas: 700x700 píxeles
 *   Colores por tipo de movimiento:
 *     - Estático/Static: #9E9E9E (gris neutro)
 *     - Pan: #E50914 (rojo Netflix)
 *     - Tilt: #B71C1C (rojo oscuro)
 *     - Zoom: #000000 (negro)
 *     - Tracking: #424242 (gris muy oscuro)
 *     - Dolly: #757575 (gris medio)
 *     - Crane: #616161 (gris oscuro)
 *   Etiquetas de porcentaje:
 *     - Negro para fondos claros (#9E9E9E, #757575)
 *     - Blanco para fondos oscuros (resto)
 */
async function generateCameraMovementDonutChart(
    distribution: Record<string, number>
): Promise<string> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 700
      canvas.height = 700

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve('')
        return
      }

      const movements = Object.entries(distribution)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 7)

      if (movements.length === 0) {
        resolve('')
        return
      }

      const CAMERA_COLORS = {
        "Estático": "#9E9E9E",
        "Static": "#9E9E9E",
        "Pan": "#E50914",
        "Tilt": "#B71C1C",
        "Zoom": "#000000",
        "Tracking": "#424242",
        "Dolly": "#757575",
        "Crane": "#616161"
      }

      const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: movements.map(([name]) => name),
          datasets: [{
            data: movements.map(([, value]) => value),
            backgroundColor: movements.map(([name]) =>
                CAMERA_COLORS[name as keyof typeof CAMERA_COLORS] || "#757575"
            ),
            borderWidth: 5,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: false,
          animation: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                font: { size: 16, weight: 'bold' },
                color: BLACK,
                padding: 20,
                boxWidth: 30
              }
            },
            tooltip: { enabled: false }
          }
        },
        plugins: [{
          id: 'doughnutLabels',
          afterDatasetsDraw(chart) {
            const ctx = chart.ctx
            const meta = chart.getDatasetMeta(0)
            meta.data.forEach((arc: any, index) => {
              const value = movements[index][1]
              if (value > 5) {
                const angle = (arc.startAngle + arc.endAngle) / 2
                const radius = (arc.innerRadius + arc.outerRadius) / 2
                const x = arc.x + Math.cos(angle) * radius
                const y = arc.y + Math.sin(angle) * radius

                const movementName = movements[index][0]
                const bgColor = CAMERA_COLORS[movementName as keyof typeof CAMERA_COLORS]

                ctx.fillStyle = (bgColor === "#9E9E9E" || bgColor === "#757575") ? 'black' : 'white'
                ctx.font = 'bold 18px sans-serif'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillText(`${value.toFixed(1)}%`, x, y)
              }
            })
          }
        }]
      })

      const imgData = canvas.toDataURL('image/png')
      chart.destroy()
      resolve(imgData)
    } catch (error) {
      console.error('Error generando camera movement donut:', error)
      resolve('')
    }
  })
}

/**
 * Genera gráfico de timeline de evolución temporal de movimientos de cámara.
 *
 * Visualiza frecuencia de hasta 5 tipos de movimiento en intervalos de 10
 * segundos mediante gráfico de barras apiladas.
 *
 * @param timeline - Array de objetos con frame, tipo de movimiento e intensidad
 * @returns Promise con data URL base64 del gráfico o string vacío si falla
 *
 * Notes:
 *   Dimensiones del canvas: 1000x500 píxeles
 *   Procesamiento de datos:
 *     - Conversión de frames a segundos (30 fps)
 *     - Agrupación en intervalos de 10 segundos
 *     - Conteo de apariciones por tipo de movimiento
 *   Configuración visual:
 *     - Barras apiladas verticalmente
 *     - Colores según CAMERA_COLORS
 *     - Etiquetas de eje X rotadas 45°
 *     - Título: "Evolución Temporal de Movimientos"
 */
async function generateCameraTimelineChart(
    timeline: Array<{ frame: number; type: string; intensity: number }>
): Promise<string> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 1000
      canvas.height = 500

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve('')
        return
      }

      if (!timeline || timeline.length === 0) {
        resolve('')
        return
      }

      const intervals: Record<number, Record<string, number>> = {}
      timeline.forEach(item => {
        const timestamp = item.frame / 30
        const interval = Math.floor(timestamp / 10) * 10
        if (!intervals[interval]) intervals[interval] = {}
        intervals[interval][item.type] = (intervals[interval][item.type] || 0) + 1
      })

      const sortedIntervals = Object.keys(intervals).map(Number).sort((a, b) => a - b)
      const labels = sortedIntervals.map(i => `${i}s`)

      const movementTypes = Array.from(
          new Set(timeline.map(item => item.type))
      ).slice(0, 5)

      const TIMELINE_COLORS = {
        "Estático": "#9E9E9E",
        "Static": "#9E9E9E",
        "Pan": "#E50914",
        "Tilt": "#B71C1C",
        "Zoom": "#000000",
        "Tracking": "#424242",
        "Dolly": "#757575",
        "Crane": "#616161"
      }

      const datasets = movementTypes.map(type => ({
        label: type,
        data: sortedIntervals.map(interval => intervals[interval][type] || 0),
        backgroundColor: TIMELINE_COLORS[type as keyof typeof TIMELINE_COLORS] || "#757575",
        borderWidth: 0
      }))

      const chart = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets },
        options: {
          responsive: false,
          animation: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                font: { size: 15, weight: 'bold' },
                color: BLACK,
                boxWidth: 28,
                padding: 18
              }
            },
            tooltip: { enabled: false },
            title: {
              display: true,
              text: 'Evolución Temporal de Movimientos',
              font: { size: 20, weight: 'bold' },
              color: BLACK,
              padding: { bottom: 18 }
            }
          },
          scales: {
            x: {
              stacked: true,
              grid: { display: false },
              ticks: {
                font: { size: 12 },
                color: MID_GRAY,
                maxRotation: 45,
                minRotation: 45
              }
            },
            y: {
              stacked: true,
              grid: { color: 'rgba(0,0,0,0.06)' },
              ticks: {
                font: { size: 13 },
                color: MID_GRAY
              }
            }
          }
        }
      })

      const imgData = canvas.toDataURL('image/png')
      chart.destroy()
      resolve(imgData)
    } catch (error) {
      console.error('Error generando camera timeline:', error)
      resolve('')
    }
  })
}

/**
 * Carga imagen desde URL y la convierte a data URL base64.
 *
 * Maneja imágenes de TMDB mediante proxy para evitar problemas CORS.
 * Dibuja imagen en canvas temporal y extrae data URL en formato JPEG.
 *
 * @param url - URL de la imagen a cargar
 * @returns Promise con data URL base64 o null si falla
 *
 * Notes:
 *   Procesamiento de URLs:
 *     - URLs de TMDB (image.tmdb.org): Redirige a /image-proxy con URL codificada
 *     - URLs relativas: Prefija con API_URL
 *     - URLs absolutas: Usa directamente
 *   Atributo crossOrigin: "anonymous" para recursos externos
 *   Formato de salida: image/jpeg para optimizar tamaño
 */
function loadImage(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const img = new Image()
      img.crossOrigin = "anonymous"

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas")
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext("2d")
          if (ctx) {
            ctx.drawImage(img, 0, 0)
            resolve(canvas.toDataURL("image/jpeg"))
          } else {
            resolve(null)
          }
        } catch (error) {
          console.error('Error convirtiendo imagen:', error)
          resolve(null)
        }
      }

      img.onerror = (error) => {
        console.error('Error cargando imagen:', url, error)
        resolve(null)
      }

      let finalUrl = url
      if (url.includes('image.tmdb.org')) {
        const encodedUrl = encodeURIComponent(url)
        finalUrl = `${API_URL}/image-proxy?url=${encodedUrl}`
      } else if (!url.startsWith("http")) {
        finalUrl = `${API_URL}${url}`
      }

      img.src = finalUrl
    } catch (error) {
      console.error('Error en loadImage:', error)
      resolve(null)
    }
  })
}

// ==================== FUNCIÓN PRINCIPAL DE GENERACIÓN ====================

/**
 * Genera documento PDF completo con análisis cinematográfico estilo Netflix.
 *
 * Función principal que orquesta generación de todas las páginas del PDF
 * incluyendo portada, actores, emociones, color, iluminación y movimientos
 * de cámara. Implementa estructura de 7 páginas con headers/footers uniformes.
 *
 * @param report - Objeto AnalysisReport con todos los datos del análisis
 * @param firstFrameUrl - URL opcional del primer frame del video
 * @param posterUrl - URL opcional del poster del contenido
 * @throws Error si report no contiene título
 *
 * Notes:
 *   Flujo de generación:
 *     1. Validación de reporte (requiere título mínimo)
 *     2. Carga asíncrona de logo y poster
 *     3. Inicialización de documento jsPDF (A4, portrait)
 *     4. Generación secuencial de 7 páginas:
 *        - Página 1: Portada con poster y título
 *        - Página 2: Actores detectados + distribución de planos
 *        - Página 3: Emociones (donut + gauge)
 *        - Página 4: Análisis de color (histograma + paleta)
 *        - Página 5: Análisis cromático + composición
 *        - Página 6: Iluminación (zonas + tipos + exposición)
 *        - Página 7: Movimientos de cámara (donut + timeline)
 *     5. Guardado con nombre "CVFlix - [título].pdf"
 *
 *   Variables de contexto:
 *     - pageWidth: 210mm (ancho A4)
 *     - pageHeight: 297mm (alto A4)
 *     - yPos: Posición vertical dinámica para contenido
 *     - pageNumber: Contador de páginas (0-indexed)
 *     - totalPages: 7 (constante)
 *
 *   Funciones auxiliares internas:
 *     - addPage(): Crea nueva página y reinicia yPos
 *     - addHeader(): Dibuja header con logo y título de sección
 *     - addFooter(): Añade fecha y numeración de página
 *
 *   Gestión de espaciado:
 *     - Header negro: 18mm desde top
 *     - Recuadro título sección: 12mm (si aplicable)
 *     - yPos inicial tras header: 43mm
 *     - Márgenes laterales: 20mm (15mm para contenido)
 *     - Footer: 10mm desde bottom
 */
export async function generateNetflixPDF(
    report: AnalysisReport,
    firstFrameUrl?: string,
    posterUrl?: string
) {
  try {
    console.log("🎬 Generando PDF estilo Netflix v2.0...")

    if (!report || !report.title) {
      throw new Error('El reporte debe tener al menos un título')
    }

    const logoImage = await loadLogo()
    if (!logoImage) {
      console.warn('⚠️ No se pudo cargar el logo desde /logo.png')
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    let yPos = 20
    let pageNumber = 0
    const totalPages = 7

    /**
     * Añade nueva página al documento PDF.
     *
     * Incrementa contador de páginas y reinicia posición vertical (yPos)
     * al valor estándar de 43mm para dejar espacio al header.
     */
    function addPage() {
      doc.addPage()
      pageNumber++
      yPos = 43
    }

    /**
     * Añade header con logo y título de sección.
     *
     * Dibuja barra negra superior de 18mm con logo centrado o texto fallback.
     * Si se proporciona título de sección, añade recuadro negro adicional
     * de 12mm con texto centrado en blanco.
     *
     * @param title - Título de la sección actual (opcional)
     * @param logoImage - Data URL del logo o null para usar texto
     */
    async function addHeader(title: string, logoImage?: string | null) {
      doc.setFillColor(...colors.black)
      doc.rect(0, 0, pageWidth, 18, "F")

      if (logoImage) {
        const logoWidth = 35
        const logoHeight = 12
        const logoX = (pageWidth - logoWidth) / 2
        const logoY = 3

        try {
          doc.addImage(logoImage, "PNG", logoX, logoY, logoWidth, logoHeight, undefined, "FAST")
        } catch (error) {
          console.error("Error añadiendo logo:", error)
          doc.setFontSize(16)
          doc.setFont("helvetica", "bold")
          doc.setTextColor(255, 255, 255)
          doc.text("CVFlix", pageWidth / 2, 12, { align: "center" })
        }
      } else {
        doc.setFontSize(16)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(255, 255, 255)
        doc.text("CVFlix", pageWidth / 2, 12, { align: "center" })
      }

      if (title) {
        doc.setFillColor(...colors.black)
        doc.rect(20, 25, pageWidth - 40, 12, "F")

        doc.setFontSize(13)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(255, 255, 255)
        doc.text(title, pageWidth / 2, 32, { align: "center" })
      }
    }

    /**
     * Añade footer con fecha y numeración de página.
     *
     * Posiciona fecha actual en formato dd/mm/yyyy en esquina inferior
     * izquierda y "Página X de Y" en esquina inferior derecha.
     *
     * @param page - Número de página actual (1-indexed para visualización)
     * @param total - Total de páginas del documento
     */
    function addFooter(page: number, total: number) {
      const currentDate = new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })

      doc.setFontSize(9)
      doc.setTextColor(...colors.mediumGray)
      doc.setFont("helvetica", "normal")
      doc.text(currentDate, 15, pageHeight - 10)
      doc.text(
          `Página ${page} de ${total}`,
          pageWidth - 15,
          pageHeight - 10,
          { align: "right" }
      )
    }

    console.log("📄 Generando página 1: Portada...")

    doc.setFillColor(...colors.black)
    doc.rect(0, 0, pageWidth, pageHeight, "F")

    if (logoImage) {
      const logoWidth = 50
      const logoHeight = 17
      const logoX = (pageWidth - logoWidth) / 2
      const logoY = 20

      try {
        doc.addImage(logoImage, "PNG", logoX, logoY, logoWidth, logoHeight, undefined, "FAST")
      } catch (error) {
        doc.setFontSize(28)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(255, 255, 255)
        doc.text("CVFlix", pageWidth / 2, 30, { align: "center" })
      }
    }

    let posterImage: string | null = null
    if (posterUrl || report.poster_url) {
      const posterUrlToUse = posterUrl || report.poster_url
      if (posterUrlToUse) {
        posterImage = await loadImage(posterUrlToUse)
      }
    }

    if (posterImage) {
      const posterWidth = 80
      const posterHeight = 120
      const posterX = (pageWidth - posterWidth) / 2
      const posterY = 50

      try {
        doc.addImage(posterImage, "JPEG", posterX, posterY, posterWidth, posterHeight, undefined, "FAST")
        doc.setDrawColor(255, 255, 255)
        doc.setLineWidth(0.5)
        doc.rect(posterX, posterY, posterWidth, posterHeight)
        yPos = posterY + posterHeight + 15
      } catch (error) {
        yPos = pageHeight / 2 - 20
      }
    } else {
      yPos = pageHeight / 2 - 30
    }

    yPos += 15;
    doc.setFontSize(36)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(255, 255, 255)
    const titleLines = doc.splitTextToSize(report.title, pageWidth - 40)
    doc.text(titleLines, pageWidth / 2, yPos, { align: "center" })
    yPos += titleLines.length * 12

    doc.setFontSize(18)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...colors.lightGray)
    doc.text("Análisis Cinematográfico Completo", pageWidth / 2, yPos + 10, { align: "center" })

    doc.setFillColor(40, 40, 40)
    doc.roundedRect(30, yPos + 20, pageWidth - 60, 30, 3, 3, "F")

    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(255, 255, 255)
    doc.text("RESUMEN DEL ANÁLISIS", pageWidth / 2, yPos + 30, { align: "center" })

    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")
    doc.text(`Duración: ${report.duration}`, 40, yPos + 38)
    doc.text(`Frames: ${report.shots}`, 40, yPos + 44)
    doc.text(`Actores: ${report.detectedActors?.length || 0}`, pageWidth - 40, yPos + 38, { align: "right" })

    console.log("📄 Generando página 2: Actores y Planos...")
    addPage()
    await addHeader("ACTORES/ACTRICES RECONOCID@S", logoImage)

    if (report.detectedActors && report.detectedActors.length > 0) {
      const actorsToShow = report.detectedActors.slice(0, 6)
      const actorImages = await Promise.all(
          actorsToShow.map(actor => actor.foto_url ? loadImage(actor.foto_url) : Promise.resolve(null))
      )

      for (let i = 0; i < actorsToShow.length; i++) {
        if (yPos > pageHeight - 35) break

        const actor = actorsToShow[i]

        if (i % 2 === 0) {
          doc.setFillColor(248, 248, 248)
          doc.roundedRect(15, yPos, pageWidth - 30, 20, 2, 2, "F")
        }

        const actorImg = actorImages[i]
        if (actorImg) {
          try {
            doc.addImage(actorImg, "JPEG", 18, yPos + 2, 16, 16, undefined, "FAST")
          } catch (error) {
            console.error("Error agregando imagen de actor:", error)
          }
        }

        const badgeColors: [number, number, number][] = [
          [255, 193, 7],
          [192, 192, 192],
          [205, 127, 50],
          [117, 117, 117]
        ]
        const selectedColor = badgeColors[Math.min(i, 3)]
        doc.setFillColor(selectedColor[0], selectedColor[1], selectedColor[2])
        doc.circle(38, yPos + 10, 3, "F")
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(8)
        doc.setFont("helvetica", "bold")
        doc.text(`${i + 1}`, 38, yPos + 11, { align: "center" })

        doc.setTextColor(0, 0, 0)
        doc.setFontSize(11)
        doc.setFont("helvetica", "bold")
        doc.text(actor.nombre, 45, yPos + 8)

        doc.setTextColor(117, 117, 117)
        doc.setFontSize(9)
        doc.setFont("helvetica", "normal")
        doc.text(actor.personaje, 45, yPos + 14)

        doc.setTextColor(183, 28, 28)
        doc.setFontSize(12)
        doc.setFont("helvetica", "bold")
        const similitud = (actor.similitud !== undefined && actor.similitud !== null)
            ? actor.similitud.toFixed(0)
            : '0'
        doc.text(`${similitud}%`, pageWidth - 20, yPos + 11, { align: "right" })

        yPos += 22
      }
      yPos += 16
    }

    if (report.shot_types_summary?.distribution) {
      if (yPos > pageHeight - 100) {
        addFooter(pageNumber + 1, totalPages)
        addPage()
        await addHeader("PLANOS CINEMATOGRÁFICOS", logoImage)
      } else {
        doc.setFillColor(...colors.black)
        doc.rect(20, yPos, pageWidth - 40, 12, "F")

        doc.setFontSize(13)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(255, 255, 255)
        doc.text("PLANOS CINEMATOGRÁFICOS", pageWidth / 2, yPos + 7, { align: "center" })
        yPos += 18
      }

      const shotChart = await generateShotDistributionChart(report.shot_types_summary.distribution)
      if (shotChart) {
        doc.addImage(shotChart, "PNG", 15, yPos, pageWidth - 30, 83, undefined, "FAST")
      }
    }

    addFooter(pageNumber + 1, totalPages)

    console.log("📄 Generando página 3: Emociones...")
    addPage()
    await addHeader("DETECCIÓN DE EMOCIONES", logoImage)

    if (report.emotions_summary?.distribution) {
      const emotionDonut = await generateEmotionDonutChart(report.emotions_summary.distribution)
      if (emotionDonut) {
        doc.addImage(emotionDonut, "PNG", (pageWidth - 110) / 2, yPos, 110, 110, undefined, "FAST")
        yPos += 118
      }

      const emotionGauge = await generateEmotionGaugeChart(
          report.emotions_summary.most_common || "Neutral",
          report.emotions_summary.distribution[report.emotions_summary.most_common || "Neutral"] || 0
      )
      if (emotionGauge) {
        doc.addImage(emotionGauge, "PNG", (pageWidth - 110) / 2, yPos, 110, 110, undefined, "FAST")
      }
    } else {
      doc.setFontSize(10)
      doc.setTextColor(...colors.mediumGray)
      doc.text("No hay datos de emociones en este análisis", 15, yPos)
    }

    addFooter(pageNumber + 1, totalPages)

    console.log("📄 Generando página 4: Análisis de Color...")
    addPage()
    await addHeader("ANÁLISIS DE COLOR", logoImage)

    if (report.histogram_data) {
      const histogram = await generateColorHistogramChart(report.histogram_data)
      if (histogram) {
        doc.addImage(histogram, "PNG", 15, yPos, pageWidth - 30, 58, undefined, "FAST")
        yPos += 90
      }
    }

    if (report.color_analysis_summary?.global_palette && Array.isArray(report.color_analysis_summary.global_palette)) {
      const colorsPalette = report.color_analysis_summary.global_palette.slice(0, 5)

      const validColors = colorsPalette.filter(c => {
        const hasHex = c && typeof c.hex === 'string' && c.hex.length > 0
        const hasRgb = c && Array.isArray(c.rgb) && c.rgb.length >= 3
        const hasFreq = c && (typeof c.percentage === 'number' || typeof c.frequency === 'number')
        return hasHex && hasRgb && hasFreq
      })

      if (validColors.length > 0) {
        doc.setFontSize(13)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(0, 0, 0)
        doc.text("Paleta de Colores Dominantes", 15, yPos)
        yPos += 10

        const totalWidth = pageWidth - 50
        const boxWidth = totalWidth / validColors.length
        const boxHeight = 30

        validColors.forEach((color, index) => {
          const x = 25 + index * boxWidth

          doc.setFillColor(color.rgb[0], color.rgb[1], color.rgb[2])
          doc.rect(x, yPos, boxWidth - 8, boxHeight, "F")

          doc.setDrawColor(200, 200, 200)
          doc.setLineWidth(0.5)
          doc.rect(x, yPos, boxWidth - 8, boxHeight)

          doc.setFont("helvetica", "bold")
          doc.setFontSize(10)
          doc.setTextColor(0, 0, 0)
          doc.text(color.hex.toUpperCase(), x + (boxWidth - 8) / 2, yPos + boxHeight + 7, { align: "center" })

          const freq = color.percentage || color.frequency || 0
          doc.setFont("helvetica", "normal")
          doc.setFontSize(9)
          doc.setTextColor(117, 117, 117)
          doc.text(`${freq.toFixed(1)}%`, x + (boxWidth - 8) / 2, yPos + boxHeight + 13, { align: "center" })
        })
      }
    }

    addFooter(pageNumber + 1, totalPages)

    console.log("📄 Generando página 5: Análisis Cromático y Composición...")
    addPage()
    await addHeader("ANÁLISIS CROMÁTICO AVANZADO", logoImage)

    if (report.color_analysis_summary?.most_common_scheme) {
      const schemeChart = await generateColorSchemeChart(
          report.color_analysis_summary.most_common_scheme,
          report.color_analysis_summary.avg_hue_difference || 45,
          report.color_analysis_summary.global_palette || []
      )
      if (schemeChart) {
        doc.addImage(schemeChart, "PNG", 15, yPos, pageWidth - 30, 67, undefined, "FAST")
        yPos += 77
      }
    }

    if (report.color_analysis_summary?.most_common_temperature) {
      const tempChart = await generateColorTemperatureGauge({
        label: report.color_analysis_summary.most_common_temperature,
        value: report.color_analysis_summary.avg_temperature_value || 0
      })
      if (tempChart) {
        doc.addImage(tempChart, "PNG", 15, yPos, pageWidth - 30, 58, undefined, "FAST")
        yPos += 60
      }
    }

    if (report.composition_summary) {
      doc.setFillColor(...colors.black)
      doc.rect(20, yPos, pageWidth - 40, 12, "F")

      doc.setFontSize(13)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(255, 255, 255)
      doc.text("COMPOSICIÓN VISUAL", pageWidth / 2, yPos + 7, { align: "center" })
      yPos += 10

      const compositionData = {
        rule_of_thirds: (report.composition_summary.avg_rule_of_thirds || 0) / 100,
        symmetry: (report.composition_summary.avg_symmetry || 0) / 100,
        balance: (report.composition_summary.avg_balance || 0) / 100,
        depth_cues: 0.5
      }

      const radarChart = await generateCompositionRadarChart(compositionData)
      if (radarChart) {
        const chartSize = 90
        doc.addImage(radarChart, "PNG", (pageWidth - chartSize) / 2, yPos, chartSize, chartSize, undefined, "FAST")
      }
    }

    addFooter(pageNumber + 1, totalPages)

    console.log("📄 Generando página 6: Análisis de Iluminación...")
    addPage()
    await addHeader("ANÁLISIS DE ILUMINACIÓN", logoImage)

    if (report.lighting_summary?.exposure?.zones) {
      const zonesChart = await generateLightingZonesChart(report.lighting_summary.exposure.zones)
      if (zonesChart) {
        doc.addImage(zonesChart, "PNG", 15, yPos, pageWidth - 30, 58, undefined, "FAST")
        yPos += 68
      }
    } else if (report.lighting_summary) {
      const defaultZones = { shadows: 0.33, midtones: 0.34, highlights: 0.33 }
      const zonesChart = await generateLightingZonesChart(defaultZones)
      if (zonesChart) {
        doc.addImage(zonesChart, "PNG", 15, yPos, pageWidth - 30, 58, undefined, "FAST")
        yPos += 85
      }
    }

    if (report.lighting_summary?.distribution) {
      const typesChart = await generateLightingTypesChart(report.lighting_summary.distribution)
      if (typesChart) {
        doc.addImage(typesChart, "PNG", 15, yPos, pageWidth - 30, 58, undefined, "FAST")
        yPos += 85
      }
    }

    if (report.lighting_summary?.exposure) {
      const exposureChart = await generateExposureGauge(
          report.lighting_summary.exposure.overexposed_pixels || 0.01,
          report.lighting_summary.exposure.underexposed_pixels || 0.01
      )
      if (exposureChart) {
        doc.addImage(exposureChart, "PNG", 15, yPos, pageWidth - 30, 58, undefined, "FAST")
      }
    } else if (report.lighting_summary) {
      const exposureChart = await generateExposureGauge(0.01, 0.01)
      if (exposureChart) {
        doc.addImage(exposureChart, "PNG", 15, yPos, pageWidth - 30, 58, undefined, "FAST")
      }
    }

    if (!report.lighting_summary) {
      doc.setFontSize(10)
      doc.setTextColor(...colors.mediumGray)
      doc.text("No hay datos de iluminación en este análisis", 15, yPos)
    }

    addFooter(pageNumber + 1, totalPages)

    console.log("📄 Generando página 7: Movimientos de Cámara...")
    addPage()
    await addHeader("MOVIMIENTOS DE CÁMARA", logoImage)

    const cameraDistribution = (report.camera_summary as any)?.movement_counts || report.camera_summary?.distribution

    if (cameraDistribution && Object.keys(cameraDistribution).length > 0) {
      const total = Object.values(cameraDistribution).reduce((sum: number, val) => sum + (val as number), 0)
      const distributionPercent: Record<string, number> = {}

      for (const [key, value] of Object.entries(cameraDistribution)) {
        distributionPercent[key] = ((value as number) / total) * 100
      }

      const cameraDonut = await generateCameraMovementDonutChart(distributionPercent)
      if (cameraDonut) {
        doc.addImage(cameraDonut, "PNG", (pageWidth - 110) / 2, yPos, 110, 110, undefined, "FAST")
        yPos += 140
      }

      if (report.camera_timeline && Array.isArray(report.camera_timeline) && report.camera_timeline.length > 0) {
        const timeline = await generateCameraTimelineChart(report.camera_timeline)
        if (timeline) {
          doc.addImage(timeline, "PNG", (pageWidth - 110) / 2, yPos, 110, 61, undefined, "FAST")
        }
      }
    }

    addFooter(pageNumber + 1, totalPages)

    const filename = `CVFlix - ${report.title}.pdf`
    doc.save(filename)
    console.log(`✅ PDF generado exitosamente: ${filename}`)

  } catch (error) {
    console.error('❌ Error generando PDF:', error)
    throw error
  }
}